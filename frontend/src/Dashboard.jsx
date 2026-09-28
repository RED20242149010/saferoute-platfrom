import React from "react";
import { Link } from "react-router-dom";
import { Shield, Plus, Map, AlertCircle } from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

import { Bar } from "react-chartjs-2";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./Dashboard.css";


/* =========================================================
   CHART SETUP
========================================================= */

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
);


/* =========================================================
   KHULNA LOCATIONS
========================================================= */

const locations = [
  {
    name: "Shibbari",
    latitude: 22.8156,
    longitude: 89.5522,
    risk: 58,
    level: "MEDIUM",
  },

  {
    name: "Gollamari",
    latitude: 22.8456,
    longitude: 89.5269,
    risk: 72,
    level: "HIGH",
  },

  {
    name: "Rupsha",
    latitude: 22.7975,
    longitude: 89.5687,
    risk: 64,
    level: "MEDIUM",
  },

  {
    name: "Moylapota",
    latitude: 22.8135,
    longitude: 89.5570,
    risk: 42,
    level: "MEDIUM",
  },
];


/* =========================================================
   MAP MARKER
========================================================= */

const createIcon = (level) => {

  let background = "#08b7d3";

  if (level === "HIGH") {
    background = "#f43f5e";
  }

  if (level === "MEDIUM") {
    background = "#f59e0b";
  }

  return L.divIcon({

    className: "custom-map-marker",

    html: `
      <div
        style="
          width:18px;
          height:18px;
          background:${background};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
        "
      ></div>
    `,

    iconSize: [18, 18],

    iconAnchor: [9, 9],
  });
};


/* =========================================================
   RISK DIAGNOSTIC LOGS
========================================================= */

const riskLogs = [

  {
    road: "Moylapota Inter.",
    risk: 42,
    level: "Mid",
  },

  {
    road: "Rupsha Highway",
    risk: 78,
    level: "High",
  },

  {
    road: "Gollamari Roundabout",
    risk: 72,
    level: "High",
  },

];


/* =========================================================
   WEEKLY CHART
========================================================= */

const chartData = {

  labels: [
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
    "S",
  ],

  datasets: [

    {
      label: "Risk Occurrence",

      data: [
        35,
        61,
        42,
        55,
        48,
        31,
        68,
      ],

      borderWidth: 0,

      borderRadius: 5,
    },

  ],
};


const chartOptions = {

  responsive: true,

  maintainAspectRatio: false,

  plugins: {

    legend: {
      display: false,
    },

    tooltip: {
      enabled: true,
    },

  },

  scales: {

    x: {

      grid: {
        display: false,
      },

      border: {
        display: false,
      },

    },

    y: {

      beginAtZero: true,

      display: false,

      border: {
        display: false,
      },

    },

  },

};


/* =========================================================
   DASHBOARD COMPONENT
========================================================= */

function Dashboard() {

  return (

    <div className="dashboard-page">


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">


        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">

            <Shield size={23} />

          </div>


          <div className="brand-text">

            <h2>
              SAFE ROUTE
            </h2>

            <span>
              KHULNA DIVISION
            </span>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="nav-links">


          {/* DASHBOARD */}

          <Link
            to="/"
            className="active"
          >
            Dashboard
          </Link>


          {/* OTHER PAGES */}

          <a href="#">
            Risk Prediction
          </a>

          <a href="#">
            Risk Map
          </a>

          <a href="#">
            Safe Routes
          </a>

          <a href="#">
            Forecast &amp; Score
          </a>

          <a href="#">
            Road Damage
          </a>

          <a href="#">
            Authority Insights
          </a>

          <a href="#">
            Admin Panel
          </a>


          {/* SIGN IN */}

          <Link to="/login">
            Sign In / Account
          </Link>


          <a href="#">
            Authority Dashboard
          </a>

        </nav>

      </header>


      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <main className="dashboard-container">


        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <section className="left-column">


          {/* HERO */}

          <div className="hero-card">

            <span className="operation-badge">
              KHULNA OPERATIONS
            </span>

            <h1>
              Safe Route Dashboard
            </h1>

            <p>
              Monitoring structural hazards, heavy traffic
              congestions, and predicting risk levels in
              real-time across Khulna City.
            </p>

          </div>


          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="stats-grid">


            {/* SAFETY SCORE */}

            <div className="stat-card">

              <span className="stat-title">
                CURRENT SAFETY SCORE
              </span>


              <div className="stat-number">

                72

                <span className="risk-dot high"></span>

              </div>


              <p>
                Classification: High Risk
              </p>

            </div>


            {/* HOTSPOTS */}

            <div className="stat-card">

              <span className="stat-title">
                ACTIVE HOTSPOTS
              </span>


              <div className="stat-number">

                3

                <span className="risk-dot medium"></span>

              </div>


              <p>
                Shibbari, Gollamari, Rupsha
              </p>

            </div>

          </div>


          {/* =================================================
              ALERT
          ================================================= */}

          <div className="alert-card">


            <div className="alert-icon">

              <AlertCircle size={24} />

            </div>


            <div>

              <strong>
                1 New Safety Alert Released
              </strong>

              <p>
                Extreme pavement damage reported near
                Gollamari Bridge. Exercise caution.
              </p>

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="quick-card">

            <h3>
              Quick Actions
            </h3>


            <div className="quick-buttons">


              <button
                className="primary-button"
                type="button"
              >

                <Plus size={18} />

                Predict Safety

              </button>


              <button
                className="secondary-button"
                type="button"
              >

                <Map size={18} />

                Inspect Map

              </button>


            </div>

          </div>

        </section>


        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <section className="right-column">


          {/* =================================================
              LIVE MAP
          ================================================= */}

          <div className="map-card">


            {/* MAP HEADER */}

            <div className="map-header">


              <div className="map-title">

                <span className="live-dot"></span>

                <strong>
                  Live Khulna Spatial Feeds
                </strong>

              </div>


              <span className="region">

                Region Center: Shibbari

              </span>

            </div>


            {/* LEAFLET MAP */}

            <MapContainer

              center={[
                22.8156,
                89.5522,
              ]}

              zoom={13}

              scrollWheelZoom={true}

              className="leaflet-map"

            >


              {/* OPENSTREETMAP */}

              <TileLayer

                attribution='&copy; OpenStreetMap contributors'

                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

              />


              {/* LOCATIONS */}

              {locations.map((location) => (

                <React.Fragment
                  key={location.name}
                >


                  {/* MARKER */}

                  <Marker

                    position={[
                      location.latitude,
                      location.longitude,
                    ]}

                    icon={
                      createIcon(
                        location.level
                      )
                    }

                  >

                    <Popup>

                      <div className="popup-content">

                        <strong>
                          {location.name}
                        </strong>

                        <br />

                        Risk Score:{" "}
                        {location.risk}

                        <br />

                        Risk Level:{" "}
                        {location.level}

                      </div>

                    </Popup>

                  </Marker>


                  {/* HIGH RISK AREA */}

                  {location.level === "HIGH" && (

                    <Circle

                      center={[
                        location.latitude,
                        location.longitude,
                      ]}

                      radius={500}

                      pathOptions={{
                        fillOpacity: 0.15,
                        weight: 1,
                      }}

                    />

                  )}

                </React.Fragment>

              ))}

            </MapContainer>

          </div>


          {/* =================================================
              BOTTOM PANELS
          ================================================= */}

          <div className="bottom-grid">


            {/* =================================================
                RISK LOGS
            ================================================= */}

            <div className="panel-card">

              <h3>
                Recent Risk Diagnostic Logs
              </h3>


              <div className="risk-list">


                {riskLogs.map((item) => (

                  <div
                    className="risk-row"
                    key={item.road}
                  >


                    <strong>
                      {item.road}
                    </strong>


                    <span
                      className={
                        item.level === "High"
                          ? "risk-value high-risk"
                          : "risk-value mid-risk"
                      }
                    >

                      <span className="small-dot"></span>

                      Risk: {item.risk} ({item.level})

                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* =================================================
                WEEKLY CHART
            ================================================= */}

            <div className="panel-card chart-panel">

              <h3>
                Risk Occurrence Rate (Weekly)
              </h3>


              <div className="chart-container">

                <Bar
                  data={chartData}
                  options={chartOptions}
                />

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>

  );
}


/* =========================================================
   EXPORT
========================================================= */

export default Dashboard;