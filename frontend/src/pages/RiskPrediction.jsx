import React, { useState } from "react";
import "../App.css";

/* ============================================================
   DATA
============================================================ */

const predictorFields = [
  {
    label: "TARGET INTERSECTION",
    value: "Gollamari, Khulna",
  },
  {
    label: "TEMPORAL FRAME",
    value: "Today, 18:30 (Peak Hour)",
  },
  {
    label: "ATMOSPHERIC STATE",
    value: "Monsoon Downpour",
  },
  {
    label: "SURFACE INTEGRITY",
    value: "Severely Damaged",
  },
  {
    label: "CONGESTION STATUS",
    value: "Dense Flow",
  },
  {
    label: "VEHICLE VELOCITY PROFILE",
    value: "Above Safety Threshold",
  },
];

const impactFactors = [
  {
    name: "Wet Road Friction Coefficient Reduction",
    percentage: 40,
    barWidth: 48,
    color: "red",
  },
  {
    name: "Excess Speed Multiplier on Approach",
    percentage: 25,
    barWidth: 28,
    color: "orange",
  },
  {
    name: "Peak Commute Traffic Congestion",
    percentage: 20,
    barWidth: 25,
    color: "orange",
  },
  {
    name: "Restricted Visual Visibility Index",
    percentage: 15,
    barWidth: 18,
    color: "cyan",
  },
];


/* ============================================================
   MAIN COMPONENT
============================================================ */

function RiskPrediction() {
  const [riskScore, setRiskScore] = useState(72);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  /* ----------------------------------------------------------
     RUN DIAGNOSTIC
  ---------------------------------------------------------- */

  const executeDiagnostic = () => {
    setRunning(true);
    setMessage("");

    setTimeout(() => {
      setRiskScore(72);
      setRunning(false);
      setMessage("Diagnostic completed successfully.");
    }, 900);
  };


  /* ----------------------------------------------------------
     DIRECTIVE ACTIONS
  ---------------------------------------------------------- */

  const inspectHeatmap = () => {
    setMessage("Spatial heatmap analysis selected.");
  };

  const generateRoute = () => {
    setMessage("Alternate route generation selected.");
  };

  const archivePrediction = () => {
    setMessage("Prediction metrics saved to archive.");
  };


  return (
    <div className="app">

      {/* ======================================================
          TOP NAVIGATION
      ======================================================= */}

      <header className="navbar">

        {/* BRAND */}

        <div className="navbar-brand">

          <div className="brand-icon">
            <ShieldIcon />
          </div>

          <div className="brand-text">

            <div className="brand-name">
              SAFE ROUTE
            </div>

            <div className="brand-location">
              KHULNA DIVISION
            </div>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="navbar-menu">

          <NavItem text="Dashboard" />

          <NavItem
            text="Risk Prediction"
            active
          />

          <NavItem text="Risk Map" />

          <NavItem text="Safe Routes" />

          <NavItem text="Forecast & Score" />

          <NavItem text="Road Damage" />

          <NavItem text="Authority Insights" />

          <NavItem text="Admin Panel" />

          <NavItem text="Sign In / Account" />

          <NavItem text="Authority Dashboard" />

        </nav>

      </header>


      {/* ======================================================
          MAIN PAGE
      ======================================================= */}

      <main className="page-container">

        <div className="main-layout">


          {/* ==================================================
              LEFT CONFIGURATION CARD
          =================================================== */}

          <aside className="configuration-card">

            <h2 className="configuration-title">
              Configure Predictor Metrics
            </h2>


            <div className="configuration-fields">

              {predictorFields.map((field) => (
                <ConfigField
                  key={field.label}
                  label={field.label}
                  value={field.value}
                />
              ))}

            </div>


            <button
              className="execute-button"
              onClick={executeDiagnostic}
              disabled={running}
            >

              {running ? (
                <>
                  <span className="spinner"></span>
                  Running Diagnostic
                </>
              ) : (
                "Execute Diagnostic Run"
              )}

            </button>

          </aside>


          {/* ==================================================
              RIGHT SIDE
          =================================================== */}

          <section className="results-section">


            {/* =================================================
                DIAGNOSTIC SUMMARY
            ================================================== */}

            <div className="diagnostic-card">

              <div className="score-circle">

                <div className="score-value">
                  {riskScore}
                </div>

                <div className="score-label">
                  INDEX
                </div>

              </div>


              <div className="diagnostic-content">

                <div className="classification">
                  CRITICAL HAZARD CLASSIFICATION
                </div>

                <h1 className="diagnostic-title">
                  Gollamari Roundabout Risk Diagnostic
                </h1>

                <p className="diagnostic-description">
                  Our model generated a safety threat score of
                  72/100, heavily catalyzed by wet surface
                  parameters and peak congestion metrics.
                </p>

              </div>

            </div>


            {/* =================================================
                LOWER SECTION
            ================================================== */}

            <div className="lower-layout">


              {/* ===============================================
                  IMPACT FACTORS
              ================================================ */}

              <section className="impact-card">

                <h2 className="section-title">
                  Attributed Impact Factors
                </h2>


                <div className="impact-list">

                  {impactFactors.map((factor) => (
                    <ImpactFactor
                      key={factor.name}
                      name={factor.name}
                      percentage={factor.percentage}
                      barWidth={factor.barWidth}
                      color={factor.color}
                    />
                  ))}

                </div>

              </section>


              {/* ===============================================
                  ROUTE DIRECTIVES
              ================================================ */}

              <section className="directives-card">

                <h2 className="section-title">
                  Subsequent Route Directives
                </h2>


                <Directive
                  title="Inspect Spatial Heatmap"
                  description="Analyze active zone density"
                  active
                  onClick={inspectHeatmap}
                />


                <Directive
                  title="Generate Alternate Route"
                  description="Circumavigate Gollamari bottleneck"
                  onClick={generateRoute}
                />


                <Directive
                  title="Commit Log to Archive"
                  description="Save prediction metrics"
                  onClick={archivePrediction}
                />

              </section>

            </div>


            {/* =================================================
                STATUS MESSAGE
            ================================================== */}

            {message && (
              <div className="status-message">
                {message}
              </div>
            )}

          </section>

        </div>

      </main>

    </div>
  );
}


/* ============================================================
   NAVIGATION ITEM
============================================================ */

function NavItem({ text, active = false }) {
  return (
    <a
      href="#"
      className={`nav-item ${active ? "active" : ""}`}
      onClick={(event) => event.preventDefault()}
    >
      {text}
    </a>
  );
}


/* ============================================================
   CONFIG FIELD
============================================================ */

function ConfigField({ label, value }) {
  return (
    <div className="config-field">

      <label className="config-label">
        {label}
      </label>

      <div className="config-value">
        {value}
      </div>

    </div>
  );
}


/* ============================================================
   IMPACT FACTOR
============================================================ */

function ImpactFactor({
  name,
  percentage,
  barWidth,
  color,
}) {
  return (
    <div className="impact-factor">

      <div className="impact-header">

        <span className="impact-name">
          {name}
        </span>

        <span className={`impact-percentage ${color}`}>
          {percentage}%
        </span>

      </div>


      <div className="progress-background">

        <div
          className={`progress-fill ${color}`}
          style={{
            width: `${barWidth}%`,
          }}
        />

      </div>

    </div>
  );
}


/* ============================================================
   ROUTE DIRECTIVE
============================================================ */

function Directive({
  title,
  description,
  active = false,
  onClick,
}) {
  return (
    <button
      className={`directive ${active ? "active" : ""}`}
      onClick={onClick}
    >

      <div className="directive-title">
        {title}
      </div>

      <div className="directive-description">
        {description}
      </div>

    </button>
  );
}


/* ============================================================
   SHIELD ICON
============================================================ */

function ShieldIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >

      <path
        d="M12 3L19 6V11.5C19 16.2 16.1 19.7 12 21C7.9 19.7 5 16.2 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

    </svg>
  );
}


export default RiskPrediction;