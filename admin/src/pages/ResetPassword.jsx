
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Ticket,
  CheckCircle2,
} from "lucide-react";

import API from "../services/api";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid password reset link. Please request a new link.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post(
        `/auth/reset-password/${token}`,
        { password }
      );

      setSuccess(
        response.data.message ||
          "Password reset successful. Please log in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-decoration reset-decoration-one" />
      <div className="reset-decoration reset-decoration-two" />

      <div className="reset-card">
        <div className="reset-brand">
          <div className="reset-logo">
            <Ticket size={29} />
          </div>

          <h1>CampusQueue</h1>
          <p>SMART CAMPUS MANAGEMENT SYSTEM</p>
        </div>

        <div className="reset-heading">
          <div className="reset-icon">
            <ShieldCheck size={27} />
          </div>

          <h2>Create New Password</h2>

          <p>
            Enter your new password below to securely access
            your CampusQueue account.
          </p>
        </div>

        {!success && (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="new-password">New Password</label>

            <div className="reset-input">
              <Lock size={19} />

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <div className="reset-input">
              <Lock size={19} />

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {error && (
              <div className="reset-error">{error}</div>
            )}

            <button
              type="submit"
              className="reset-submit"
              disabled={loading || !token}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {success && (
          <div className="reset-success">
            <CheckCircle2 size={30} />
            <p>{success}</p>

            <button
              type="button"
              className="reset-submit"
              onClick={() => navigate("/")}
            >
              Go to Login
            </button>
          </div>
        )}

        {!token && !error && (
          <div className="reset-error">
            Reset token is missing. Please request a new password
            reset email.
          </div>
        )}

        <div className="reset-footer">
          <ShieldCheck size={17} />
          <span>Secure CampusQueue Access</span>
        </div>
      </div>

      <p className="reset-copyright">
        © 2026 CampusQueue Management System
      </p>
    </div>
  );
}

export default ResetPassword;
