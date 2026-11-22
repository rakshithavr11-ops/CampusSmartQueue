
import { useEffect, useState } from "react";
import API from "../services/api";
import "./StaffDashboard.css";

function StaffDashboard({ staff, onLogout }) {
  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState("");
  const [queue, setQueue] = useState([]);
  const [counterInfo, setCounterInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCounters = async () => {
    try {
      const response = await API.get("/counters/my-counters");
      const data = response.data.counters || [];

      setCounters(data);

      if (data.length > 0) {
        setSelectedCounter((current) =>
          current && data.some((c) => c._id === current)
            ? current
            : data[0]._id
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load assigned counters."
      );
    }
  };

  const fetchQueue = async () => {
    if (!selectedCounter) return;

    try {
      setLoading(true);

      const response = await API.get(
        `/queue/counter?counterId=${selectedCounter}`
      );

      setQueue(response.data.tokens || []);
      setCounterInfo(response.data.counter);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load queue."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounters();
  }, []);

  useEffect(() => {
    if (selectedCounter) {
      setQueue([]);
      fetchQueue();
    }
  }, [selectedCounter]);

  const callNext = async () => {
    try {
      setMessage("");

      const response = await API.post("/queue/call-next", {
        counterId: selectedCounter,
      });

      setMessage(response.data.message);
      await fetchQueue();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to call next student."
      );
    }
  };

  const updateToken = async (tokenId, status) => {
    try {
      setMessage("");

      const response = await API.put(
        `/queue/${tokenId}/status`,
        { status }
      );

      setMessage(response.data.message);
      await fetchQueue();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update token."
      );
    }
  };

  const toggleCounter = async () => {
    if (!counterInfo) return;

    const newStatus =
      counterInfo.status === "active" ? "paused" : "active";

    try {
      setMessage("");

      const response = await API.put(
        "/counters/my-counters/status",
        {
          counterId: selectedCounter,
          status: newStatus,
        }
      );

      setMessage(response.data.message);
      await fetchCounters();
      await fetchQueue();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update counter."
      );
    }
  };

  const waitingCount = queue.filter(
    (token) => token.status === "waiting"
  ).length;

  const currentToken = queue.find(
    (token) => ["called", "serving"].includes(token.status)
  );

  return (
    <div className="staff-dashboard">
      <header className="staff-header">
        <div>
          <h1>Staff Dashboard</h1>
          <p>Welcome, {staff?.name || "Staff Member"}</p>
        </div>

        <button className="staff-logout" onClick={onLogout}>
          Logout
        </button>
      </header>

      {message && (
        <div className="staff-message">{message}</div>
      )}

      <section className="staff-card">
        <h2>My Assigned Counters</h2>

        {counters.length === 0 ? (
          <p className="staff-empty">
            No counters have been assigned to you.
          </p>
        ) : (
          <>
            <select
              className="staff-select"
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
            >
              {counters.map((counter) => (
                <option key={counter._id} value={counter._id}>
                  {counter.name} - {counter.service?.name}
                </option>
              ))}
            </select>

            {counterInfo && (
              <div style={{ marginTop: "20px" }}>
                <p>
                  <strong>Counter Status: </strong>
                  <span
                    className={`staff-status ${counterInfo.status}`}
                  >
                    {counterInfo.status.toUpperCase()}
                  </span>
                </p>

                <p>
                  <strong>Service:</strong>{" "}
                  {counterInfo.service?.name || "N/A"}
                </p>

                <button
                  className={`staff-button ${
                    counterInfo.status === "active"
                      ? "staff-warning"
                      : "staff-success"
                  }`}
                  onClick={toggleCounter}
                >
                  {counterInfo.status === "active"
                    ? "Pause Counter"
                    : "Resume Counter"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {selectedCounter && (
        <>
          <section className="staff-card">
            <h2>Queue Overview</h2>

            <div>
              <p>
                <strong>Waiting Students:</strong> {waitingCount}
              </p>

              <p>
                <strong>Current Token:</strong>{" "}
                {counterInfo?.currentToken || 0}
              </p>

              <p>
                <strong>Currently Serving:</strong>{" "}
                {currentToken?.tokenNumber
                  ? `Token ${currentToken.tokenNumber} (${currentToken.status})`
                  : "Nobody"}
              </p>
            </div>

            <button
              className="staff-button staff-primary"
              onClick={callNext}
              disabled={
                counterInfo?.status !== "active" ||
                !!currentToken
              }
            >
              Call Next Student
            </button>

            <button
              className="staff-button staff-refresh"
              onClick={fetchQueue}
            >
              Refresh Queue
            </button>
          </section>

          <section className="staff-card">
            <h2>Student Queue</h2>

            {loading ? (
              <p>Loading queue...</p>
            ) : queue.length === 0 ? (
              <p className="staff-empty">
                No queue records found for this counter.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="staff-queue-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {queue.map((token) => (
                      <tr key={token._id}>
                        <td>{token.tokenNumber}</td>

                        <td>
                          {token.student?.name || "Student"}
                        </td>

                        <td>{token.status}</td>

                        <td>
                          {token.status === "called" && (
                            <>
                              <button
                                className="staff-button staff-success"
                                onClick={() =>
                                  updateToken(token._id, "serving")
                                }
                              >
                                Start Serving
                              </button>

                              <button
                                className="staff-button staff-danger"
                                onClick={() =>
                                  updateToken(token._id, "skipped")
                                }
                              >
                                Skip
                              </button>
                            </>
                          )}

                          {token.status === "serving" && (
                            <button
                              className="staff-button staff-success"
                              onClick={() =>
                                updateToken(token._id, "completed")
                              }
                            >
                              Complete
                            </button>
                          )}

                          {["waiting", "completed", "skipped"].includes(
                            token.status
                          ) && (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default StaffDashboard;
