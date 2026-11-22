
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

  const changeRole = (selectedRole) => {
    setRole(selectedRole);
    setIsRegister(false);
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <Ticket size={28} />
          </div>

          <h1>CampusQueue</h1>
          <p>SMART CAMPUS MANAGEMENT</p>
        </div>

        <div className="login-heading">
          <div className="security-icon">
            <ShieldCheck size={25} />
          </div>

          <h2>
            {isRegister ? "Create Student Account" : "Welcome back!"}
          </h2>

          <p>
            {isRegister
              ? "Register to access campus queue services."
              : "Sign in to access your CampusQueue account."}
          </p>
        </div>

        <div className="role-selection">
          {["admin", "staff", "student"].map((item) => (
            <button
              key={item}
              type="button"
              className={role === item ? "role-option active" : "role-option"}
              onClick={() => changeRole(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label htmlFor="student-name">Full Name</label>
              <div className="login-input">
                <UserRound size={18} />
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
                <Phone size={18} />
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
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

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

        {role === "student" && (
          <div className="registration-option">
            {isRegister
              ? "Already have an account?"
              : "New student?"}

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </div>
        )}

        <div className="login-footer">
          <ShieldCheck size={16} />
          Secure CampusQueue Access
        </div>
      </div>

      <p className="login-copyright">
        © 2026 CampusQueue Management System
      </p>
    </div>
  );
}

export default Login;
