
import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";

import {
  GraduationCap,
  Wallet,
  BookOpen,
  Building2,
  Utensils,
  Ticket,
  Clock,
  RefreshCw,
  LogOut,
  CheckCircle,
} from "lucide-react";

import "./StudentDashboard.css";

function StudentDashboard({ student, onLogout }) {
  const [services, setServices] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [historyTokens, setHistoryTokens] = useState([]);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // LOAD STUDENT DASHBOARD DATA
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        serviceResponse,
        tokenResponse,
        historyResponse,
      ] = await Promise.all([
        API.get("/services"),
        API.get("/queue/my-tokens"),
        API.get("/queue/my-history"),
      ]);

      setServices(serviceResponse.data.services || []);
      setTokens(tokenResponse.data.tokens || []);
      setHistoryTokens(historyResponse.data.tokens || []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load dashboard. Please refresh."
      );
    } finally {
      setLoading(false);
    }
  };

  // SOCKET.IO REAL-TIME CONNECTION
  useEffect(() => {
    loadDashboard();

    // Correct student ID field
    if (!student?.id) {
      console.error("Student ID is missing!");
      return;
    }

    // Join student's personal Socket.IO room
    const joinStudentRoom = () => {
      socket.emit("join-student-room", student.id);
      console.log("Joined student room:", student.id);
    };

    // Receive queue updates
    const handleQueueUpdate = () => {
      console.log("Real-time queue update received!");
      loadDashboard();
    };

    socket.on("connect", joinStudentRoom);
    socket.on("queue-updated", handleQueueUpdate);

    // Connect to backend
    socket.connect();

    return () => {
      socket.off("connect", joinStudentRoom);
      socket.off("queue-updated", handleQueueUpdate);
      socket.disconnect();
    };

  }, [student?.id]);

  // GENERATE QUEUE TOKEN
  const joinQueue = async (serviceId) => {
    try {
      setJoining(serviceId);
      setMessage("");
      setError("");

      const response = await API.post("/queue/join", {
        serviceId,
      });

      setMessage(
        `${response.data.message}. Your token number is ${response.data.token.tokenNumber}.`
      );

      await loadDashboard();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to join the queue."
      );
    } finally {
      setJoining("");
    }
  };

  // SERVICE ICON
  const getServiceIcon = (name) => {
    const value = name.toLowerCase();

    if (value.includes("exam")) return GraduationCap;
    if (value.includes("account")) return Wallet;
    if (value.includes("library")) return BookOpen;
    if (value.includes("canteen")) return Utensils;

    return Building2;
  };

  // TOKEN STATUS CSS CLASS
  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  // FORMAT DATE AND TIME
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="student-loading">
        Loading Student Dashboard...
      </div>
    );
  }

  return (
    <div className="student-dashboard">

      {/* HEADER */}
      <header className="student-header">

        <div className="student-brand">
          <Ticket size={28} />

          <div>
            <h2>Campus Smart Queue</h2>
            <p>Student Portal</p>
          </div>
        </div>

        <div className="student-profile">
          <span>
            Welcome, {student?.name || "Student"}
          </span>

          <button onClick={onLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>

      </header>

      <main className="student-main">

        {/* WELCOME SECTION */}
        <section className="student-welcome">

          <div>
            <h1>Welcome to Campus Smart Queue!</h1>

            <p>
              Select a service, generate your token and
              avoid standing in long queues.
            </p>
          </div>

          <Ticket size={65} />

        </section>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="student-success">
            <CheckCircle size={19} />
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="student-error">
            {error}
          </div>
        )}

        {/* AVAILABLE SERVICES */}
        <section className="student-section">

          <div className="student-section-heading">

            <div>
              <h2>Available Services</h2>
              <p>Choose the service you need.</p>
            </div>

            <button
              className="student-refresh"
              onClick={loadDashboard}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>

          <div className="student-service-grid">

            {services.map((service) => {
              const Icon = getServiceIcon(service.name);

              const hasActiveToken = tokens.some(
                (token) =>
                  token.service?._id === service._id
              );

              return (
                <div
                  className="student-service-card"
                  key={service._id}
                >

                  <div className="service-icon">
                    <Icon size={27} />
                  </div>

                  <h3>{service.name}</h3>

                  <p>
                    {service.description ||
                      "Campus assistance service"}
                  </p>

                  <span className="service-time">
                    <Clock size={15} />

                    Average service time:{" "}
                    {service.averageServiceTime} min
                  </span>

                  <button
                    className="join-queue-button"
                    disabled={
                      joining === service._id ||
                      hasActiveToken
                    }
                    onClick={() => joinQueue(service._id)}
                  >
                    {joining === service._id
                      ? "Joining..."
                      : hasActiveToken
                      ? "Token Already Active"
                      : "Generate Queue Token"}
                  </button>

                </div>
              );
            })}

          </div>

          {services.length === 0 && (
            <p>No active services available.</p>
          )}

        </section>

        {/* ACTIVE QUEUE TOKENS */}
        <section className="student-section">

          <div className="student-section-heading">
            <div>
              <h2>My Active Queue Tokens</h2>
              <p>Track your current queue status.</p>
            </div>
          </div>

          {tokens.length === 0 ? (

            <div className="student-empty">
              <Ticket size={40} />

              <h3>No Active Tokens</h3>

              <p>
                Generate a token from an available service
                to see it here.
              </p>
            </div>

          ) : (

            <div className="student-token-grid">

              {tokens.map((token) => (
                <div
                  className="student-token-card"
                  key={token._id}
                >

                  <div className="token-top">

                    <span>
                      {token.service?.name || "Campus Service"}
                    </span>

                    <span
                      className={`token-status ${getStatusClass(
                        token.status
                      )}`}
                    >
                      {token.status}
                    </span>

                  </div>

                  <h2>Token #{token.tokenNumber}</h2>

                  <p>
                    <Building2 size={16} />

                    {token.counter?.name ||
                      "Counter not assigned"}
                  </p>

                  <p>
                    <Clock size={16} />

                    Estimated wait:{" "}
                    {token.estimatedWaitTime ?? 0} minutes
                  </p>

                </div>
              ))}

            </div>

          )}

        </section>

        {/* COMPLETE TOKEN HISTORY */}
        <section className="student-section">

          <div className="student-section-heading">
            <div>
              <h2>My Token History</h2>

              <p>
                View your previous and completed queue tokens.
              </p>
            </div>
          </div>

          {historyTokens.length === 0 ? (

            <div className="student-empty">
              <Clock size={40} />

              <h3>No Token History</h3>

              <p>
                Your previous queue tokens will appear here.
              </p>
            </div>

          ) : (

            <div className="student-token-grid">

              {historyTokens.map((token) => (
                <div
                  className="student-token-card"
                  key={token._id}
                >

                  <div className="token-top">

                    <span>
                      {token.service?.name || "Campus Service"}
                    </span>

                    <span
                      className={`token-status ${getStatusClass(
                        token.status
                      )}`}
                    >
                      {token.status}
                    </span>

                  </div>

                  <h2>Token #{token.tokenNumber}</h2>

                  <p>
                    <Building2 size={16} />

                    {token.counter?.name ||
                      "Counter not assigned"}
                  </p>

                  <p>
                    <Clock size={16} />

                    Issued: {formatDate(token.issuedAt)}
                  </p>

                  {token.completedAt && (
                    <p>
                      <CheckCircle size={16} />

                      Completed: {formatDate(token.completedAt)}
                    </p>
                  )}

                </div>
              ))}

            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default StudentDashboard;
