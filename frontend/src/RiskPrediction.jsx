
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  BrainCircuit,
  Map,
  Navigation,
  ChartNoAxesCombined,
  Construction,
  Lightbulb,
  User,
  LogOut,
  Activity,
  AlertTriangle,
  CloudRain,
  Car,
  Gauge,
  RefreshCw,
} from "lucide-react";
import "./RiskPrediction.css";

const API_BASE_URL = "http://localhost:8000";

const locations = [
  { id: 1, name: "Shibbari Circle" },
  { id: 2, name: "TEST - Simulated Road Hazard B" },
  { id: 3, name: "KDA Avenue" },
  { id: 4, name: "Boyra Bazar Intersection" },
  { id: 5, name: "Moylapota More" },
  { id: 6, name: "Royal More" },
  { id: 7, name: "Sonadanga Bus Terminal" },
  { id: 8, name: "Fulbari Gate" },
  { id: 9, name: "Shipyard Road" },
  { id: 10, name: "Khulna-Mongla Highway (Batiaghata Link)" },
  { id: 11, name: "Daulatpur Bazar Road" },
  { id: 12, name: "Khan Jahan Ali Road" },
  { id: 13, name: "Khulna-Jessore Highway (City Entry)" },
  { id: 14, name: "Rupsha Bridge Approach" },
  { id: 15, name: "Nirala Moor" },
  { id: 16, name: "Khalishpur Main Road" },
  { id: 17, name: "Majid Sarani" },
  { id: 18, name: "Gollamari Intersection" },
  { id: 19, name: "Rupsha Ghat Road" },
];

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      success: false,
      message: text || `Server returned HTTP ${response.status}.`,
    };
  }
}

function RiskPrediction() {
  const navigate = useNavigate();

  // USER ACCOUNT
  const [username, setUsername] = useState(
    () => localStorage.getItem("saferoute_username") || ""
  );
  const [loggingOut, setLoggingOut] = useState(false);

  // PREDICTION INPUTS
  const [locationId, setLocationId] = useState("18");
  const [temporalFrame, setTemporalFrame] = useState(
    "Today, 18:30 (Peak Hour)"
  );
  const [atmosphere, setAtmosphere] = useState("Monsoon Downpour");
  const [surface, setSurface] = useState("Severely Damaged");
  const [congestion, setCongestion] = useState("Dense Flow");
  const [velocity, setVelocity] = useState(
    "Above Safety Threshold"
  );

  // PREDICTION DATA
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // PREDICTION HISTORY
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const selectedLocation = locations.find(
    (location) => String(location.id) === String(locationId)
  );

  // CHECK DJANGO LOGIN SESSION
  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/me/`, {
          method: "GET",
          credentials: "include",
        });

        const data = await readResponse(response);

        if (!isMounted) return;

        if (
          response.ok &&
          data.success &&
          data.authenticated
        ) {
          setUsername(data.username);

          localStorage.setItem("saferoute_username", data.username);
          localStorage.setItem("saferoute_logged_in", "true");
        } else if (response.status === 401) {
          setUsername("");
          localStorage.removeItem("saferoute_username");
          localStorage.removeItem("saferoute_logged_in");
        }
      } catch (err) {
        console.error("Could not check Django session:", err);

        if (isMounted) {
          setUsername(
            localStorage.getItem("saferoute_username") || ""
          );
        }
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // LOGOUT
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Django logout returned:", response.status);
      }
    } catch (err) {
      console.error("Could not contact logout endpoint:", err);
    } finally {
      localStorage.removeItem("saferoute_username");
      localStorage.removeItem("saferoute_logged_in");
      localStorage.removeItem("saferoute_role");
      localStorage.removeItem("saferoute_remember");

      setUsername("");
      setLoggingOut(false);

      navigate("/login", { replace: true });
    }
  };

  // LOAD PREDICTION HISTORY
  const loadPredictionHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/predictions/history/`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await readResponse(response);

      if (response.ok && data.success) {
        setHistory(data.history || []);
      } else {
        setHistoryError(
          data.message || `Could not load history (HTTP ${response.status}).`
        );
      }
    } catch (err) {
      console.error("History loading error:", err);
      setHistoryError("Unable to connect to the Django server.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // LOAD HISTORY WHEN PAGE OPENS
  useEffect(() => {
    loadPredictionHistory();
  }, []);

  // RUN RISK PREDICTION
  const handlePredict = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");
    setPrediction(null);

    const requestData = {
      location_id: Number(locationId),
      temporal_frame: temporalFrame,
      atmosphere,
      surface,
      congestion,
      velocity,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/predictions/predict/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestData),
        }
      );

      const data = await readResponse(response);

      console.log("Prediction request:", requestData);
      console.log("Prediction response:", data);

      if (response.ok && data.success) {
        const result = data.prediction || data;

        setPrediction(result);
        setMessage(
          data.message || "Risk prediction completed successfully."
        );

        await loadPredictionHistory();
      } else {
        setError(
          data.message ||
          `Prediction failed. Server returned HTTP ${response.status}.`
        );
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Cannot connect to the Django server. Check that it is running.");
    } finally {
      setLoading(false);
    }
  };

  // ROUTE DIRECTIVES
  const handleDirective = (action) => {
    if (action === "heatmap") {
      navigate("/risk-map");
    } else if (action === "route") {
      navigate("/safe-routes");
    } else if (action === "archive") {
      if (prediction) {
        setMessage("Your prediction has been saved in the history.");
      } else {
        setMessage("Run a prediction before viewing its saved result.");
      }
    }
  };

  // READ RESULT VALUES
  const riskScore = Number(
    prediction?.risk_score ?? prediction?.score ?? 72
  );

  const riskLevel =
    prediction?.risk_level ||
    prediction?.risk_classification ||
    "Demo Score";

  const riskColor = riskLevel.toLowerCase().includes("low")
    ? "low"
    : riskLevel.toLowerCase().includes("moderate")
    ? "moderate"
    : "high";

  const displayLocation =
    prediction?.location ||
    selectedLocation?.name ||
    "Gollamari Intersection";

  return (
    <div className="risk-page">
      {/* NAVIGATION BAR */}
      <header className="risk-navbar">
        <Link to="/" className="risk-brand">
          <span className="brand-icon">
            <Shield size={23} />
          </span>

          <span className="brand-text">
            <strong>SAFE ROUTE</strong>
            <small>KHULNA DIVISION</small>
          </span>
        </Link>

        <nav className="risk-nav-links" aria-label="Main navigation">
          <Link to="/">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>

          <Link to="/risk-prediction" className="active">
            <BrainCircuit size={15} />
            Risk Prediction
          </Link>

          <Link to="/risk-map">
            <Map size={15} />
            Risk Map
          </Link>

          <Link to="/safe-routes">
            <Navigation size={15} />
            Safe Routes
          </Link>

          <Link to="/forecast">
            <ChartNoAxesCombined size={15} />
            Forecast &amp; Score
          </Link>

          <Link to="/road-damage">
            <Construction size={15} />
            Road Damage
          </Link>

          <Link to="/authority-insights">
            <Lightbulb size={15} />
            Authority Insights
          </Link>

          <a
            href={`${API_BASE_URL}/admin/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Admin Panel
          </a>
        </nav>

        {/* ACCOUNT AREA */}
        <div className="risk-account-area">
          {username ? (
            <>
              <div className="risk-account-name">
                <User size={15} />
                <span>{username}</span>
              </div>

              <button
                type="button"
                className="risk-logout-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={14} />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="risk-login-button"
              onClick={() => navigate("/login")}
            >
              Sign In / Account
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="risk-main">
        {/* PAGE HEADING */}
        <section className="risk-page-heading">
          <div>
            <div className="risk-eyebrow">
              KHULNA OPERATIONS
            </div>

            <h1>Risk Prediction</h1>

            <p>
              Configure road and traffic conditions to generate
              a risk assessment.
            </p>
          </div>

          <div className="prediction-module-badge">
            <Activity size={22} />
            <span>Prediction Module</span>
          </div>
        </section>

        {/* MESSAGES */}
        {error && (
          <div className="risk-message error-message" role="alert">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        {message && (
          <div className="risk-message success-message" role="status">
            {message}
          </div>
        )}

        {/* PREDICTION CONTENT */}
        <section className="risk-content-grid">
          {/* INPUT FORM */}
          <div className="risk-input-card">
            <div className="risk-card-heading">
              <div>
                <span className="risk-section-label">
                  INPUT PARAMETERS
                </span>
                <h2>Configure Predictor Metrics</h2>
              </div>

              <div className="risk-heading-icon">
                <BrainCircuit size={23} />
              </div>
            </div>

            <form onSubmit={handlePredict}>
              {/* LOCATION */}
              <div className="risk-form-group">
                <label htmlFor="location">
                  TARGET INTERSECTION
                </label>

                <select
                  id="location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}, Khulna
                    </option>
                  ))}
                </select>
              </div>

              {/* TIME: MATCHES TEMPORAL_SCORES */}
              <div className="risk-form-group">
                <label htmlFor="temporalFrame">
                  TEMPORAL FRAME
                </label>

                <select
                  id="temporalFrame"
                  value={temporalFrame}
                  onChange={(e) => setTemporalFrame(e.target.value)}
                >
                  <option>Today, 18:30 (Peak Hour)</option>
                  <option>Today, 10:00 (Normal Hour)</option>
                  <option>Today, 22:00 (Night)</option>
                  <option>Tomorrow, 08:00 (Morning Peak)</option>
                </select>
              </div>

              {/* WEATHER: MATCHES WEATHER_SCORES */}
              <div className="risk-form-group">
                <label htmlFor="atmosphere">
                  ATMOSPHERIC STATE
                </label>

                <select
                  id="atmosphere"
                  value={atmosphere}
                  onChange={(e) => setAtmosphere(e.target.value)}
                >
                  <option>Monsoon Downpour</option>
                  <option>Heavy Rain</option>
                  <option>Cloudy</option>
                  <option>Clear Sky</option>
                  <option>Foggy</option>
                </select>
              </div>

              {/* SURFACE: MATCHES SURFACE_SCORES */}
              <div className="risk-form-group">
                <label htmlFor="surface">
                  ROAD SURFACE CONDITION
                </label>

                <select
                  id="surface"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                >
                  <option>Severely Damaged</option>
                  <option>Moderately Damaged</option>
                  <option>Minor Damage</option>
                  <option>Good Condition</option>
                </select>
              </div>

              {/* CONGESTION: MATCHES CONGESTION_SCORES */}
              <div className="risk-form-group">
                <label htmlFor="congestion">
                  TRAFFIC CONGESTION
                </label>

                <select
                  id="congestion"
                  value={congestion}
                  onChange={(e) => setCongestion(e.target.value)}
                >
                  <option>Dense Flow</option>
                  <option>Moderate Flow</option>
                  <option>Light Flow</option>
                  <option>No Congestion</option>
                </select>
              </div>

              {/* VELOCITY: MATCHES VELOCITY_SCORES */}
              <div className="risk-form-group">
                <label htmlFor="velocity">
                  VEHICLE VELOCITY
                </label>

                <select
                  id="velocity"
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                >
                  <option>Above Safety Threshold</option>
                  <option>Normal Speed</option>
                  <option>Below Normal Speed</option>
                </select>
              </div>

              <button
                type="submit"
                className="risk-predict-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={17} className="spin-icon" />
                    Analyzing Conditions...
                  </>
                ) : (
                  <>
                    <BrainCircuit size={17} />
                    Generate Risk Prediction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RESULTS COLUMN */}
          <div className="risk-results-column">
            {/* SCORE CARD */}
            <div className="risk-score-card">
              <div className={`risk-score-circle ${riskColor}`}>
                <strong>{riskScore}</strong>
                <span>INDEX / 100</span>
              </div>

              <div className="risk-score-information">
                <span className={`risk-score-badge ${riskColor}`}>
                  {prediction ? riskLevel : "DEMO SCORE"}
                </span>

                <h2>{displayLocation} Risk Diagnostic</h2>

                <p>
                  {prediction
                    ? prediction.explanation ||
                      "This is the risk assessment returned by the Django prediction API."
                    : "This is a sample display score. Execute a diagnostic run to retrieve the actual score from Django."}
                </p>
              </div>
            </div>

            {/* LOWER RESULT CARDS */}
            <div className="risk-lower-grid">
              {/* IMPACT FACTORS */}
              <div className="risk-impact-card">
                <span className="risk-section-label">
                  RISK CONTRIBUTORS
                </span>

                <h2>Attributed Impact Factors</h2>

                <div className="impact-row">
                  <span>Wet Road Friction Coefficient Reduction</span>
                  <strong>40%</strong>
                </div>

                <div className="impact-row">
                  <span>Excess-Speed Multiplier on Approach</span>
                  <strong>25%</strong>
                </div>

                <div className="impact-row">
                  <span>Traffic Congestion Influence</span>
                  <strong>20%</strong>
                </div>

                <div className="impact-row">
                  <span>Road Surface Damage Influence</span>
                  <strong>15%</strong>
                </div>
              </div>

              {/* ROUTE DIRECTIVES */}
              <div className="risk-directives-card">
                <span className="risk-section-label">
                  NEXT ACTIONS
                </span>

                <h2>Route Directives</h2>

                <button
                  type="button"
                  onClick={() => handleDirective("heatmap")}
                >
                  <Map size={18} />
                  <span>Inspect Spatial Heatmap</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirective("route")}
                >
                  <Navigation size={18} />
                  <span>Find Safer Route</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirective("archive")}
                >
                  <Activity size={18} />
                  <span>View Prediction Archive</span>
                </button>
              </div>
            </div>

            {/* SELECTED CONDITIONS */}
            <div className="risk-condition-card">
              <span className="risk-section-label">
                DIAGNOSTIC CONDITIONS
              </span>

              <h2>Selected Environmental Factors</h2>

              <div className="condition-grid">
                <div className="condition-item">
                  <CloudRain size={19} />
                  <div>
                    <small>Atmosphere</small>
                    <strong>{atmosphere}</strong>
                  </div>
                </div>

                <div className="condition-item">
                  <Construction size={19} />
                  <div>
                    <small>Road Surface</small>
                    <strong>{surface}</strong>
                  </div>
                </div>

                <div className="condition-item">
                  <Car size={19} />
                  <div>
                    <small>Traffic</small>
                    <strong>{congestion}</strong>
                  </div>
                </div>

                <div className="condition-item">
                  <Gauge size={19} />
                  <div>
                    <small>Vehicle Velocity</small>
                    <strong>{velocity}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREDICTION HISTORY */}
        <section className="risk-history-card">
          <div className="risk-history-heading">
            <div>
              <span className="risk-section-label">
                PREVIOUS ANALYSES
              </span>
              <h2>Prediction History</h2>
            </div>

            <button
              type="button"
              onClick={loadPredictionHistory}
              disabled={historyLoading}
              className="history-refresh-button"
            >
              <RefreshCw size={15} />
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {historyLoading ? (
            <p className="history-status">
              Loading prediction history...
            </p>
          ) : historyError ? (
            <p className="history-status history-error">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <p className="history-status">
              No prediction records found. Generate your first prediction.
            </p>
          ) : (
            <div className="risk-history-table-wrapper">
              <table className="risk-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Predicted At</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.location}</td>
                      <td>{item.risk_score}</td>
                      <td>{item.risk_level}</td>
                      <td>
                        {item.predicted_at
                          ? new Date(item.predicted_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default RiskPrediction;
