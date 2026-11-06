
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./SafeRoutes.css";
import Navbar from "./components/Navbar";

// ==================================================
// CONSTANTS
// ==================================================

const KHULNA_CENTER = [22.8456, 89.5403];

const API_URL = "http://127.0.0.1:8000/api/routes/find/";
const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";

const ROUTE_ORIGIN_STORAGE_KEY = "saferoute_route_origin";

const PREFERENCES = ["Safest", "Balanced", "Fastest"];

// ==================================================
// ORIGIN HELPERS
// ==================================================

function readSavedRouteOrigin() {
  try {
    const saved = sessionStorage.getItem(ROUTE_ORIGIN_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not read saved origin:", error);
    return null;
  }
}

function hasValidCoordinates(origin) {
  if (
    !origin ||
    origin.lat === null ||
    origin.lat === undefined ||
    origin.lon === null ||
    origin.lon === undefined
  ) {
    return false;
  }

  const lat = Number(origin.lat);
  const lon = Number(origin.lon);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

// ==================================================
// MAP AUTO ZOOM
// ==================================================

function FitRoute({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 1) {
      map.fitBounds(positions, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [map, positions]);

  return null;
}

// ==================================================
// MAP MARKERS
// ==================================================

const startIcon = new L.DivIcon({
  className: "route-marker start-marker",
  html: '<span class="marker-letter">S</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const endIcon = new L.DivIcon({
  className: "route-marker end-marker",
  html: '<span class="marker-letter">D</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// ==================================================
// GENERAL HELPERS
// ==================================================

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(digits)
    : "N/A";
}

function hasValidScore(item) {
  return (
    item?.risk_data_available !== false &&
    item?.risk_score !== null &&
    item?.risk_score !== undefined &&
    item?.risk_score !== "" &&
    Number.isFinite(Number(item.risk_score))
  );
}

// ==================================================
// HAZARD COUNTS
// Matches the Django nearby_hazards response.
// ==================================================

function getHazardCounts(route) {
  const hazards = Array.isArray(route?.nearby_hazards)
    ? route.nearby_hazards
    : [];

  return {
    hotspotCount: hazards.filter(
      (hazard) => hazard.type === "Hotspot"
    ).length,

    damageCount: hazards.filter(
      (hazard) => hazard.type === "Road Damage"
    ).length,
  };
}

// ==================================================
// RISK STATUS
// ==================================================

function RiskStatus({ score, available }) {
  if (available === false) {
    return (
      <span className="risk-status risk-status-unknown">
        Insufficient hazard data
      </span>
    );
  }

  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(Number(score))
  ) {
    return (
      <span className="risk-status risk-status-unknown">
        Risk unavailable
      </span>
    );
  }

  const value = Number(score);

  if (value >= 60) {
    return (
      <span className="risk-status risk-status-high">
        High Risk
      </span>
    );
  }

  if (value >= 25) {
    return (
      <span className="risk-status risk-status-medium">
        Moderate Risk
      </span>
    );
  }

  return (
    <span className="risk-status risk-status-low">
      Low Risk
    </span>
  );
}

// ==================================================
// METRIC CARD
// ==================================================

function MetricCard({ label, value, description }) {
  return (
    <div className="safe-metric-card">
      <span className="safe-metric-label">{label}</span>

      <strong className="safe-metric-value">
        {value}
      </strong>

      {description && (
        <span className="safe-metric-description">
          {description}
        </span>
      )}
    </div>
  );
}

// ==================================================
// GEOCODING
// ==================================================

async function geocodeLocation(locationName) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${locationName}, Khulna, Bangladesh`,
    limit: "1",
    countrycodes: "bd",
  });

  const response = await fetch(
    `${GEOCODING_URL}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Could not search for the location. Please try again."
    );
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      `Location "${locationName}" could not be found. Enter a more specific Khulna location.`
    );
  }

  const latitude = Number(results[0].lat);
  const longitude = Number(results[0].lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("The location service returned invalid coordinates.");
  }

  return [latitude, longitude];
}

// ==================================================
// GEOJSON TO LEAFLET COORDINATES
// GeoJSON: [longitude, latitude]
// Leaflet: [latitude, longitude]
// ==================================================

function convertGeometryToPositions(geometry) {
  const coordinates = geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return [];
  }

  return coordinates
    .filter(
      (coordinate) =>
        Array.isArray(coordinate) &&
        coordinate.length >= 2 &&
        Number.isFinite(Number(coordinate[0])) &&
        Number.isFinite(Number(coordinate[1]))
    )
    .map(([longitude, latitude]) => [
      Number(latitude),
      Number(longitude),
    ]);
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function SafeRoutes() {
  const location = useLocation();

  // ------------------------------------------------
  // ORIGIN
  // ------------------------------------------------

  const [origin, setOrigin] = useState(() => {
    const saved =
      location.state?.routeOrigin || readSavedRouteOrigin();

    return (
      saved?.full_name ||
      saved?.name ||
      "Shibbari Circle, Khulna"
    );
  });

  const [originCoordinates, setOriginCoordinates] = useState(() => {
    const saved =
      location.state?.routeOrigin || readSavedRouteOrigin();

    if (!hasValidCoordinates(saved)) {
      return null;
    }

    return {
      lat: Number(saved.lat),
      lon: Number(saved.lon),
    };
  });

  // ------------------------------------------------
  // FORM AND ROUTE STATE
  // ------------------------------------------------

  const [destination, setDestination] = useState("");
  const [preference, setPreference] = useState("Safest");

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [endpoints, setEndpoints] = useState(null);

  // ------------------------------------------------
  // RECEIVE ORIGIN FROM RISK PREDICTION
  // ------------------------------------------------

  useEffect(() => {
    const transferred =
      location.state?.routeOrigin || readSavedRouteOrigin();

    if (!transferred) return;

    const transferredName =
      transferred.full_name ||
      transferred.name ||
      "Shibbari Circle, Khulna";

    setOrigin(transferredName);

    if (hasValidCoordinates(transferred)) {
      setOriginCoordinates({
        lat: Number(transferred.lat),
        lon: Number(transferred.lon),
      });
    } else {
      setOriginCoordinates(null);
    }

    setRoute(null);
    setEndpoints(null);
    setError("");
    setLastUpdated("");
  }, [location.key, location.state]);

  // ==================================================
  // FIND ROUTE
  // ==================================================

  async function findRoute(event) {
    event.preventDefault();

    if (loading) return;

    if (!origin.trim()) {
      setError("Please enter an origin node.");
      return;
    }

    if (!destination.trim()) {
      setError("Please enter a destination node.");
      return;
    }

    setLoading(true);
    setError("");
    setRoute(null);
    setEndpoints(null);
    setLastUpdated("");

    try {
      // 1. GET ORIGIN COORDINATES

      let start;

      if (originCoordinates) {
        start = [
          originCoordinates.lat,
          originCoordinates.lon,
        ];
      } else {
        start = await geocodeLocation(origin.trim());
      }

      // 2. GET DESTINATION COORDINATES

      const end = await geocodeLocation(destination.trim());

      setEndpoints({ start, end });

      // 3. CALL DJANGO ROUTING API

      const params = new URLSearchParams({
        start_lon: String(start[1]),
        start_lat: String(start[0]),
        end_lon: String(end[1]),
        end_lat: String(end[0]),
        preference,
      });

      const response = await fetch(
        `${API_URL}?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The Django server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          `Route calculation failed (${response.status}).`
        );
      }

      // 4. VALIDATE ROUTE GEOMETRY

      if (!data.geometry?.coordinates?.length) {
        throw new Error(
          "The routing service returned no route geometry."
        );
      }

      const positions = convertGeometryToPositions(data.geometry);

      if (positions.length < 2) {
        throw new Error("The selected route geometry is invalid.");
      }

      // 5. SAVE SELECTED ROUTE

      const newRoute = {
        ...data,
        preference,
        positions,

        routes_found:
          data.routes_found ??
          data.route_count ??
          1,
      };

      setRoute(newRoute);

      setLastUpdated(new Date().toLocaleString());

    } catch (err) {
      console.error("Route calculation error:", err);

      setError(
        err.message ||
        "Could not calculate the route. Check your internet connection and Django server."
      );

    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // HANDLE INPUT CHANGES
  // ==================================================

  function handleLocationChange(type, value) {
    if (type === "origin") {
      setOrigin(value);
      setOriginCoordinates(null);
    } else {
      setDestination(value);
    }

    setRoute(null);
    setEndpoints(null);
    setError("");
    setLastUpdated("");
  }

  // ==================================================
  // ROUTE HAZARD INFORMATION
  // ==================================================

  const hazardCounts = getHazardCounts(route);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="safe-routes-page">
      <Navbar />

      <main className="safe-routes-main">

        {/* PAGE HEADING */}

        <section className="safe-routes-heading">
          <div>
            <span className="section-eyebrow">
              KHULNA OPERATIONS
            </span>

            <h1>Safe Route Planner</h1>

            <p>
              Find a driving route using recorded road hazards
              and estimated travel time.
            </p>
          </div>

          <div className="connection-indicator">
            <span className="connection-dot" />
            Route planning service
          </div>
        </section>

        <div className="safe-routes-layout">

          {/* LEFT SIDEBAR */}

          <aside className="route-sidebar">

            {/* ROUTE CONFIGURATION */}

            <section className="route-panel">
              <div className="panel-heading">
                <span className="panel-icon">⌖</span>

                <div>
                  <h2>Determine Optimal Route</h2>
                  <p>
                    Configure your starting point and destination.
                  </p>
                </div>
              </div>

              <form
                onSubmit={findRoute}
                className="route-form"
              >
                <label htmlFor="origin">
                  Origin Node
                </label>

                <input
                  id="origin"
                  type="text"
                  value={origin}
                  onChange={(event) =>
                    handleLocationChange("origin", event.target.value)
                  }
                  placeholder="Enter starting intersection"
                  required
                />

                <small className="origin-help-text">
                  {originCoordinates
                    ? "Origin received from Risk Prediction with coordinates."
                    : "Enter an origin manually or transfer an intersection from Risk Prediction."}
                </small>

                <label htmlFor="destination">
                  Destination Node
                </label>

                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(event) =>
                    handleLocationChange(
                      "destination",
                      event.target.value
                    )
                  }
                  placeholder="Enter your destination in Khulna"
                  required
                />

                <small className="destination-help-text">
                  Example: Rupsha Bridge, Sonadanga Bus Terminal,
                  or Moylapota.
                </small>

                <span className="form-label">
                  Heuristic Preference
                </span>

                <div className="preference-buttons">
                  {PREFERENCES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        preference === item ? "selected" : ""
                      }
                      aria-pressed={preference === item}
                      onClick={() => {
                        setPreference(item);
                        setRoute(null);
                        setEndpoints(null);
                        setError("");
                        setLastUpdated("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button
                  className="find-route-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner" />
                      Calculating Route...
                    </>
                  ) : (
                    "Find Route"
                  )}
                </button>
              </form>

              {error && (
                <div className="route-error" role="alert">
                  <strong>Route calculation failed</strong>
                  <p>{error}</p>
                </div>
              )}
            </section>

            {/* SELECTED ROUTE */}

            <section className="route-panel result-panel">
              <div className="section-title-row">
                <h2>Selected Route</h2>

                {route && (
                  <span className="result-indicator">
                    Calculated
                  </span>
                )}
              </div>

              {!route && !loading && !error && (
                <div className="empty-route-state">
                  <span className="empty-route-icon">⌁</span>

                  <h3>No route calculated yet</h3>

                  <p>
                    Enter your destination and click Find Route
                    to calculate your route.
                  </p>
                </div>
              )}

              {loading && (
                <div className="loading-state">
                  <span className="loading-spinner" />

                  <p>
                    Finding a route and evaluating recorded
                    road hazards...
                  </p>
                </div>
              )}

              {route && (
                <article className="route-result">

                  <div className="route-result-heading">
                    <div>
                      <span className="section-eyebrow">
                        SELECTED ROUTE
                      </span>

                      <h3>
                        {route.preference} Route Result
                      </h3>
                    </div>

                    <span className="route-result-icon">✓</span>
                  </div>

                  <div className="route-endpoints-summary">
                    <p>
                      <strong>Origin:</strong> {origin}
                    </p>

                    <p>
                      <strong>Destination:</strong> {destination}
                    </p>
                  </div>

                  <RiskStatus
                    score={route.risk_score}
                    available={route.risk_data_available}
                  />

                  <p className="route-explanation">
                    {route.explanation ||
                      "Route selected using the configured preference."}
                  </p>

                  <div className="route-metrics">
                    <div>
                      <span>Distance</span>

                      <strong>
                        {formatNumber(
                          route.distance_km ?? route.distance,
                          2
                        )} km
                      </strong>
                    </div>

                    <div>
                      <span>Estimated time</span>

                      <strong>
                        {formatNumber(
                          route.duration_minutes ?? route.duration,
                          1
                        )} min
                      </strong>
                    </div>
                  </div>

                  <div className="route-risk-metrics">
                    <MetricCard
                      label="Estimated Risk Score"
                      value={
                        hasValidScore(route)
                          ? formatNumber(route.risk_score, 1)
                          : "N/A"
                      }
                      description="Heuristic score, not a probability"
                    />

                    <MetricCard
                      label="Recorded Hotspots Nearby"
                      value={
                        Array.isArray(route.nearby_hazards)
                          ? hazardCounts.hotspotCount
                          : "N/A"
                      }
                    />

                    <MetricCard
                      label="Unrepaired Road Damage"
                      value={
                        Array.isArray(route.nearby_hazards)
                          ? hazardCounts.damageCount
                          : "N/A"
                      }
                    />
                  </div>

                  {route.risk_data_available === false && (
                    <div className="route-data-warning">
                      <strong>Limited hazard data</strong>

                      <p>
                        No matching hazard data was available
                        for this route. Missing records do not
                        mean the route is safe.
                      </p>
                    </div>
                  )}

                  <div className="route-alternative-count">
                    Candidate routes returned:{" "}
                    <strong>
                      {route.routes_found ?? 1}
                    </strong>
                  </div>

                  {lastUpdated && (
                    <p className="route-updated-time">
                      Calculated at {lastUpdated}
                    </p>
                  )}

                

                  {route.source && (
                    <p className="route-source">
                      Data source: {route.source}
                    </p>
                  )}
                </article>
              )}
            </section>
          </aside>

          {/* RIGHT MAP COLUMN */}

          <div className="route-map-column">

            {/* MAP */}

            <section className="map-panel">

              <div className="map-panel-heading">
                <div>
                  <span className="section-eyebrow">
                    MAP VIEW
                  </span>

                  <h2>Khulna Route Map</h2>
                </div>

                <span className="map-provider-label">
                  OpenStreetMap
                </span>
              </div>

              <div className="route-map">
                <MapContainer
                  center={KHULNA_CENTER}
                  zoom={13}
                  scrollWheelZoom
                  className="leaflet-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* ORIGIN MARKER */}

                  {endpoints?.start && (
                    <Marker
                      position={endpoints.start}
                      icon={startIcon}
                    >
                      <Popup>
                        Origin: {origin}
                      </Popup>
                    </Marker>
                  )}

                  {/* DESTINATION MARKER */}

                  {endpoints?.end && (
                    <Marker
                      position={endpoints.end}
                      icon={endIcon}
                    >
                      <Popup>
                        Destination: {destination}
                      </Popup>
                    </Marker>
                  )}

                  {/* SELECTED ROUTE */}

                  {route?.positions?.length > 1 && (
                    <Polyline
                      positions={route.positions}
                      pathOptions={{
                        color: "#0891b2",
                        weight: 7,
                        opacity: 0.95,
                      }}
                    >
                      <Popup>
                        <strong>Selected Route</strong>

                        <br />

                        Preference: {route.preference}

                        <br />

                        Risk score:{" "}
                        {hasValidScore(route)
                          ? formatNumber(route.risk_score, 1)
                          : "Unavailable"}

                        <br />

                        Distance:{" "}
                        {formatNumber(
                          route.distance_km ?? route.distance,
                          2
                        )} km

                        <br />

                        Estimated time:{" "}
                        {formatNumber(
                          route.duration_minutes ?? route.duration,
                          1
                        )} min
                      </Popup>
                    </Polyline>
                  )}

                  {/* FIT MAP TO SELECTED ROUTE */}

                  {route?.positions?.length > 1 && (
                    <FitRoute positions={route.positions} />
                  )}

                  {/* FIT MAP TO ENDPOINTS BEFORE ROUTE */}

                  {!route && endpoints && (
                    <FitRoute
                      positions={[
                        endpoints.start,
                        endpoints.end,
                      ]}
                    />
                  )}
                </MapContainer>
              </div>

              {/* MAP LEGEND */}

              <div className="map-legend">
                <span>
                  <i className="legend-origin" />
                  Origin
                </span>

                <span>
                  <i className="legend-destination" />
                  Destination
                </span>

                {route && (
                  <span>
                    <i className="legend-alternative-one" />
                    Selected route
                  </span>
                )}
              </div>
            </section>

            {/* ROUTE INSTRUCTIONS */}

            <section className="route-panel trajectory-panel">

              <div className="section-title-row">
                <div>
                  <h2>Step Trajectory Summary</h2>

                  <p className="panel-description">
                    Driving instructions for the selected route.
                  </p>
                </div>
              </div>

              {!route && (
                <div className="empty-route-state compact-empty-state">
                  Route instructions will appear here after calculation.
                </div>
              )}

              {route && (
                <>
                  <div className="trajectory-summary">
                    <span className="section-eyebrow">
                      {route.preference.toUpperCase()} SELECTION
                    </span>

                    <p>
                      {route.explanation ||
                        "Route selected using the configured preference."}
                    </p>
                  </div>

                  {Array.isArray(route.steps) &&
                  route.steps.length > 0 ? (
                    <ol className="route-steps">
                      {route.steps.map((step, index) => (
                        <li
                          key={index}
                          className="route-step"
                        >
                          <span className="route-step-number">
                            {index + 1}
                          </span>

                          <div className="route-step-content">
                            <strong>
                              {step.road ||
                                step.name ||
                                "Route instruction"}
                            </strong>

                            <span>
                              {step.instruction || "Continue"}
                            </span>
                          </div>

                          <span className="route-step-distance">
                            {formatNumber(
                              step.distance_km ?? step.distance,
                              2
                            )} km
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="panel-description">
                      No step-by-step instructions were returned.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="safe-routes-footer">
        <span> KHULNA DIVISION</span>

        <span>
          Route risk estimates are not safety guarantees.
        </span>
      </footer>
    </div>
  );
}
