
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import "./Login.css";

const API_BASE_URL = "http://localhost:8000";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!username.trim() || !password) {
      setMessage("Please enter your username and password.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Obtain a CSRF token from Django.
      const csrfResponse = await fetch(
        `${API_BASE_URL}/api/csrf/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!csrfResponse.ok) {
        throw new Error(
          "Could not obtain a CSRF token. Check your Django server and /api/csrf/ endpoint."
        );
      }

      const csrfData = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error(
          "Django did not return a CSRF token."
        );
      }

      console.log("CSRF response received.");

      // Step 2: Send the login request.
      const response = await fetch(
        `${API_BASE_URL}/api/login/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfData.csrfToken,
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("LOGIN STATUS:", response.status);
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.detail ||
            "Login failed. Please check your username and password."
        );
      }

      // Step 3: Save the login information for the frontend.
      localStorage.setItem(
        "saferoute_username",
        data.username || username.trim()
      );

      localStorage.setItem("saferoute_logged_in", "true");

      localStorage.setItem(
        "saferoute_remember",
        rememberMe ? "true" : "false"
      );

      if (data.role) {
        localStorage.setItem("saferoute_role", data.role);
      }

      // Step 4: Display success and open the dashboard.
      setMessage("Login successful! Redirecting to dashboard...");
      setMessageType("success");

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error.message ||
          "Cannot connect to the server. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Shield size={32} />
            </div>

            <h1>SAFE ROUTE</h1>
            <p>AI-Powered Road Safety System</p>
          </div>

          <div className="login-heading">
            <h2>Welcome Back</h2>
            <p>Sign in to access your SafeRoute dashboard.</p>
          </div>

          {message && (
            <div
              className={`login-message ${messageType}`}
              role="alert"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-register-link">
            <p>
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </div>

          <div className="login-footer">
            <p>SAFE ROUTE · KHULNA DIVISION</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;