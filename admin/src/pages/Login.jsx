
import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Ticket,
  UserRound,
  Phone,
  Users,
  GraduationCap,
} from "lucide-react";

import API from "../services/api";
import "./Login.css";

function Login({ onLogin }) {
  const [role, setRole] = useState("admin");
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const roles = [
    { id: "admin", label: "Admin", icon: ShieldCheck },
    { id: "staff", label: "Staff", icon: Users },
    { id: "student", label: "Student", icon: GraduationCap },
  ];

  // LOGIN AND STUDENT REGISTRATION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (isRegister) {
        response = await API.post("/auth/register", {
          name,
          email,
          phone,
          password,
        });
      } else {
        response = await API.post("/auth/login", {
          email,
          password,
        });
      }

      const data = response.data;

      if (!data.token || !data.user) {
        throw new Error("Authentication information was not received.");
      }

      if (data.user.role !== role) {
        throw new Error(
          `This account does not belong to the ${role} role.`
        );
      }

      sessionStorage.setItem("authToken", data.token);

      if (role === "admin") {
        sessionStorage.setItem("adminToken", data.token);
      } else {
        sessionStorage.removeItem("adminToken");
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to continue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setForgotError("");
    setForgotMessage("");
    setForgotLoading(true);

    try {
      const response = await API.post("/auth/forgot-password", {
        email: forgotEmail.trim(),
      });

      setForgotMessage(response.data.message);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          "Unable to send reset email. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // CHANGE ACCOUNT ROLE
  const changeRole = (selectedRole) => {
    setRole(selectedRole);
    setIsRegister(false);
    setShowForgotPassword(false);
    setError("");
    setForgotError("");
    setForgotMessage("");
  };

  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />

      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <Ticket size={29} strokeWidth={2.2} />
          </div>

          <h1>CampusQueue</h1>
          <p>SMART CAMPUS MANAGEMENT SYSTEM</p>
        </div>

        {/* Welcome */}
        <div className="login-heading">
          <div className="security-icon">
            <ShieldCheck size={27} />
          </div>

          <h2>
            {isRegister ? "Create Student Account" : "Welcome back!"}
          </h2>

          <p>
            {isRegister
              ? "Register to access campus queue services."
              : "Sign in to access your campus account."}
          </p>
        </div>

        {/* Role Selection */}
        <div className="role-section">
          <label className="role-label">
            Select your account type
          </label>

          <div className="role-selection">
            {roles.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`role-option ${
                    role === item.id ? "active" : ""
                  }`}
                  onClick={() => changeRole(item.id)}
                  aria-pressed={role === item.id}
                >
                  <Icon size={23} strokeWidth={2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login and Registration Form */}
        <form onSubmit={handleSubmit}>

          {isRegister && (
            <>
              <label htmlFor="student-name">Full Name</label>

              <div className="login-input">
                <UserRound size={19} />

                <input
                  id="student-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="student-phone">Phone Number</label>

              <div className="login-input">
                <Phone size={19} />

                <input
                  id="student-phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <label htmlFor="login-email">Email Address</label>

          <div className="login-input">
            <Mail size={19} />

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>

          <div className="login-input">
            <Lock size={19} />

            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              minLength={6}
              required
            />

            <button
              type="button"
              className="password-toggle"
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

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Forgot Password Link */}
          {!isRegister && (
            <div className="forgot-password-link">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotEmail(email);
                }}
              >
                {showForgotPassword ? "Close" : "Forgot Password?"}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Student Account"
                : "Sign In"}
          </button>
        </form>

        {/* Forgot Password Form */}
        {showForgotPassword && !isRegister && (
          <form
            onSubmit={handleForgotPassword}
            className="forgot-password-form"
          >
            <label htmlFor="forgot-email">
              Registered Email Address
            </label>

            <div className="login-input">
              <Mail size={19} />

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>

            {forgotError && (
              <div className="login-error">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="forgot-success">
                {forgotMessage}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Student Registration */}
        {role === "student" && (
          <div className="registration-option">
            {isRegister
              ? "Already have an account?"
              : "New student?"}

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setShowForgotPassword(false);
                setError("");
                setForgotError("");
                setForgotMessage("");
              }}
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <ShieldCheck size={17} />
          <span>Secure CampusQueue Access</span>
        </div>
      </div>

      <p className="login-copyright">
        © 2026 CampusQueue Management System
      </p>
    </div>
  );
}

export default Login;
