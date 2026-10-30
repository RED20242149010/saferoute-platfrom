
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const API_BASE_URL = "http://localhost:8000";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // ================================================
  // REGISTER NEW USER
  // ================================================
  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const cleanUsername = username.trim();

    // Validate required fields.
    if (!cleanUsername || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    // Validate password confirmation.
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    // Validate minimum password length.
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: cleanUsername,
          password: password,
          confirm_password: confirmPassword,
        }),
      });

      // Safely handle a non-JSON response.
      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please try again."
        );
      }

      console.log("REGISTRATION RESPONSE:", data);

      if (!response.ok || !data.success) {
        setMessage(data.message || "Registration failed. Please try again.");
        setMessageType("error");
        return;
      }

      // Save login information for the dashboard.
      const registeredUsername = data.username || cleanUsername;

      localStorage.setItem(
        "saferoute_username",
        registeredUsername
      );

      localStorage.setItem("saferoute_logged_in", "true");

      // Show success feedback.
      setMessage("Account created successfully! Redirecting...");
      setMessageType("success");

      // Redirect to the dashboard.
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 700);
    } catch (error) {
      console.error("REGISTRATION ERROR:", error);

      setMessage(
        error.message ===
          "The server returned an invalid response. Please try again."
          ? error.message
          : "Cannot connect to the Django server. Make sure it is running."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ================================================
  // GO TO LOGIN PAGE
  // ================================================
  const handleLogin = () => {
    navigate("/login");
  };

  // ================================================
  // REGISTRATION UI
  // ================================================
  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1>SAFE ROUTE</h1>
          <p>Create Your Account</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="register-username">
              Username
            </label>

            <input
              id="register-username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">
              Password
            </label>

            <input
              id="register-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>

            <input
              id="register-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={6}
              required
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`register-message ${messageType}`}
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="login-link">
            <span>Already have an account?</span>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;