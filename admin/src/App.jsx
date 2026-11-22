
import Login from "./pages/Login";
import "./App.css";
import { useEffect, useState } from "react";
import API from "./services/api";
import StaffDashboard from "./pages/StaffDashboard";
import StudentDashboard from "./pages/StudentDashboard";

import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Clock3,
  CheckCircle2,
  UserRound,
  ArrowUpRight,
  MoreHorizontal,
  CalendarDays,
  Menu,
  X,
  CircleHelp,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Queue Management", icon: Ticket },
  { name: "Students", icon: Users },
  { name: "Services", icon: Building2 },
  { name: "Counters & Staff", icon: UserRound },
  { name: "Analytics", icon: BarChart3 },
];



const queueData = [
  {
    token: "#T-103",
    student: "Rahul Sharma",
    service: "Examination Section",
    counter: "Counter 1",
    status: "Serving",
    time: "09:42 AM",
  },
  {
    token: "#T-104",
    student: "Priya Kumar",
    service: "Accounts Section",
    counter: "Counter 2",
    status: "Waiting",
    time: "09:45 AM",
  },
  {
    token: "#T-105",
    student: "Arjun Reddy",
    service: "Library",
    counter: "Counter 3",
    status: "Waiting",
    time: "09:48 AM",
  },
  {
    token: "#T-106",
    student: "Sneha Patel",
    service: "Administration Office",
    counter: "Counter 4",
    status: "Completed",
    time: "09:50 AM",
  },
];

function App() {
  const [admin, setAdmin] = useState(() => {
  try {
    const token =
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("adminToken");

    const savedUser =
      sessionStorage.getItem("authUser") ||
      sessionStorage.getItem("adminUser");

    const user = savedUser ? JSON.parse(savedUser) : null;

    return token && user &&
      ["admin", "staff", "student"].includes(user.role)
      ? user
      : null;
  } catch {
    return null;
  }
});


  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard statistics
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  // Analytics data
const [analyticsData, setAnalyticsData] = useState(null);
const [analyticsLoading, setAnalyticsLoading] = useState(false);
const [analyticsError, setAnalyticsError] = useState("");
const [analyticsRefresh, setAnalyticsRefresh] = useState(0);
const chartData = analyticsData?.hourlyActivity || [];

  // Queue Management data
  const [queueTokens, setQueueTokens] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("All");
  const [queueRefresh, setQueueRefresh] = useState(0);

  // Students Management data
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsRefresh, setStudentsRefresh] = useState(0);

  // Counters & Staff Management data
  const [counters, setCounters] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [countersLoading, setCountersLoading] = useState(false);
  const [countersError, setCountersError] = useState("");
  const [countersRefresh, setCountersRefresh] = useState(0);

  // Create Counter form
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterName, setCounterName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [counterSaving, setCounterSaving] = useState(false);
  const [counterMessage, setCounterMessage] = useState("");
  // Assign staff to existing counters
const [selectedStaffByCounter, setSelectedStaffByCounter] = useState({});
const [assigningCounterId, setAssigningCounterId] = useState("");
// Create Staff form
const [showStaffForm, setShowStaffForm] = useState(false);
const [staffName, setStaffName] = useState("");
const [staffEmail, setStaffEmail] = useState("");
const [staffPassword, setStaffPassword] = useState("");
const [staffPhone, setStaffPhone] = useState("");
const [staffSaving, setStaffSaving] = useState(false);
const [staffMessage, setStaffMessage] = useState("");

    // Services Management data
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicesRefresh, setServicesRefresh] = useState(0);

  // Add Service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [averageServiceTime, setAverageServiceTime] = useState(5);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceMessage, setServiceMessage] = useState("");

  // Fetch all queue tokens when Queue Management opens
  useEffect(() => {
  if (
  !admin ||
  admin.role !== "admin" ||
  (activePage !== "Queue Management" && activePage !== "Dashboard")
) {
  return;
}

    const fetchQueueTokens = async () => {
      try {
        setQueueLoading(true);
        setQueueError("");

        const response = await API.get("/queue/all");

        setQueueTokens(response.data.tokens || []);
      } catch (error) {
        console.error("Queue fetching error:", error);

        setQueueError(
          error.response?.data?.message ||
            "Unable to load queue records. Please try again."
        );
      } finally {
        setQueueLoading(false);
      }
    };

    fetchQueueTokens();
  }, [admin, activePage, queueRefresh]);

  // Fetch all registered students when Students page opens
  useEffect(() => {
    if (!admin || admin.role !== "admin" || activePage !== "Students") {
      return;
    }

    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        setStudentsError("");

        const response = await API.get("/auth/students");

        setStudents(response.data.students || []);
      } catch (error) {
        console.error("Students fetching error:", error);

        setStudentsError(
          error.response?.data?.message ||
            "Unable to load students. Please try again."
        );
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [admin, activePage, studentsRefresh]);
    // Fetch active services when Services page opens
  useEffect(() => {
    if (!admin || admin.role !== "admin" || activePage !== "Services") {
      return;
    }

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        setServicesError("");

        const response = await API.get("/services");

        setServices(response.data.services || []);
      } catch (error) {
        console.error("Services fetching error:", error);

        setServicesError(
          error.response?.data?.message ||
            "Unable to load services. Please try again."
        );
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, [admin, activePage, servicesRefresh]);

  // Fetch Counters and Staff from backend
  // Fetch Counters and Staff from backend
useEffect(() => {
  if (
    !admin ||
    admin.role !== "admin" ||
    (activePage !== "Counters & Staff" && activePage !== "Dashboard")
  ) {
    return;
  }

  const fetchCountersAndStaff = async () => {
    try {
      setCountersLoading(true);
      setCountersError("");

      // Dashboard only needs counter information
      if (activePage === "Dashboard") {
        const response = await API.get("/counters");
        setCounters(response.data.counters || []);
        return;
      }

      // Counters & Staff page needs all three records
      const [counterResponse, staffResponse, serviceResponse] =
        await Promise.all([
          API.get("/counters"),
          API.get("/auth/staff"),
          API.get("/services"),
        ]);

      setCounters(counterResponse.data.counters || []);
      setStaffMembers(staffResponse.data.staff || []);
      setServices(serviceResponse.data.services || []);
    } catch (error) {
      console.error("Counters and Staff fetching error:", error);

      setCountersError(
        error.response?.data?.message ||
          "Unable to load counters and staff."
      );
    } finally {
      setCountersLoading(false);
    }
  };

  fetchCountersAndStaff();
}, [admin, activePage, countersRefresh]);
  // Fetch real dashboard statistics
  useEffect(() => {
    if (!admin || admin.role !== "admin") {
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setStatsLoading(true);

        const response = await API.get("/dashboard/stats");

        setStatsData(response.data.stats);
      } catch (error) {
        console.error("Dashboard stats error:", error);
        setStatsData(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [admin]);
  // Fetch Analytics data from backend
  useEffect(() => {
    if (
  !admin ||
  admin.role !== "admin" ||
  (activePage !== "Analytics" && activePage !== "Dashboard")
) {
  return;
}

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const response = await API.get("/dashboard/analytics");

        setAnalyticsData(response.data.analytics);
      } catch (error) {
        console.error("Analytics fetching error:", error);

        setAnalyticsError(
          error.response?.data?.message ||
            "Unable to load analytics data."
        );
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [admin, activePage, analyticsRefresh]);
 const handleLogin = (user, token) => {
  sessionStorage.setItem("authToken", token);
  sessionStorage.setItem("authUser", JSON.stringify(user));

  if (user.role === "admin") {
    sessionStorage.setItem("adminToken", token);
    sessionStorage.setItem("adminUser", JSON.stringify(user));
  } else {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");
  }

  setAdmin(user);
  setActivePage("Dashboard");
};

const handleLogout = () => {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("authUser");
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");

  setAdmin(null);
  setStatsData(null);
  setAnalyticsData(null);
  setQueueTokens([]);
};
    // Create a new service
  const handleAddService = async (event) => {
    event.preventDefault();

    if (!serviceName.trim()) {
      setServiceMessage("Please enter a service name.");
      return;
    }

    try {
      setServiceSaving(true);
      setServiceMessage("");

      await API.post("/services", {
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        averageServiceTime: Number(averageServiceTime),
      });

      setServiceName("");
      setServiceDescription("");
      setAverageServiceTime(5);
      setShowServiceForm(false);
      setServiceMessage("Service created successfully!");

      setServicesRefresh((previous) => previous + 1);
    } catch (error) {
      console.error("Create service error:", error);

      setServiceMessage(
        error.response?.data?.message ||
          "Unable to create service. Please try again."
      );
    } finally {
      setServiceSaving(false);
    }
  };

  // Create a new counter
  const handleAddCounter = async (event) => {
    event.preventDefault();

    if (!counterName.trim() || !selectedService) {
      setCounterMessage("Please enter a counter name and select a service.");
      return;
    }

    try {
      setCounterSaving(true);
      setCounterMessage("");

      await API.post("/counters", {
        name: counterName.trim(),
        serviceId: selectedService,
        ...(selectedStaff ? { staffId: selectedStaff } : {}),
      });

      setCounterMessage("Counter created successfully!");
      setCounterName("");
      setSelectedService("");
      setSelectedStaff("");
      setShowCounterForm(false);

      setCountersRefresh((previous) => previous + 1);
    } catch (error) {
      setCounterMessage(
        error.response?.data?.message || "Unable to create counter."
      );
    } finally {
      setCounterSaving(false);
    }
  };
  // Assign staff to an existing counter
const handleAssignStaff = async (counterId) => {
  const staffId = selectedStaffByCounter[counterId];

  if (!staffId) {
    setCounterMessage("Please select a staff member first.");
    return;
  }

  try {
    setAssigningCounterId(counterId);
    setCounterMessage("");

    const response = await API.put(
      `/counters/${counterId}/assign-staff`,
      { staffId }
    );

    setCounterMessage(
      response.data.message || "Staff assigned successfully!"
    );

    setCountersRefresh((previous) => previous + 1);
  } catch (error) {
    console.error("Assign staff error:", error);

    setCounterMessage(
      error.response?.data?.message || "Unable to assign staff."
    );
  } finally {
    setAssigningCounterId("");
  }
};
// Create a new staff account
const handleCreateStaff = async (event) => {
  event.preventDefault();

  if (!staffName.trim() || !staffEmail.trim() || !staffPassword) {
    setStaffMessage("Please fill in all required fields.");
    return;
  }

  if (staffPassword.length < 6) {
    setStaffMessage("Password must contain at least 6 characters.");
    return;
  }

  try {
    setStaffSaving(true);
    setStaffMessage("");

    const response = await API.post("/auth/create-staff", {
      name: staffName.trim(),
      email: staffEmail.trim(),
      password: staffPassword,
      phone: staffPhone.trim(),
    });

    setStaffMessage(
      response.data.message || "Staff account created successfully!"
    );

    setStaffName("");
    setStaffEmail("");
    setStaffPassword("");
    setStaffPhone("");
    setShowStaffForm(false);

    setCountersRefresh((previous) => previous + 1);
  } catch (error) {
    console.error("Create staff error:", error);

    setStaffMessage(
      error.response?.data?.message || "Unable to create staff account."
    );
  } finally {
    setStaffSaving(false);
  }
};

  // Filter and search queue records
  const filteredQueueTokens = queueTokens.filter((token) => {
    const studentName = token.student?.name || "";
    const tokenNumber = token.tokenNumber || token.token || "";

    const matchesSearch =
      studentName.toLowerCase().includes(queueSearch.toLowerCase()) ||
      String(tokenNumber).toLowerCase().includes(queueSearch.toLowerCase());

    const matchesFilter =
      queueFilter === "All" ||
      token.status?.toLowerCase() === queueFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Filter and search registered students
  const filteredStudents = students.filter((student) => {
    const search = studentSearch.toLowerCase();

    return (
      (student.name || "").toLowerCase().includes(search) ||
      (student.email || "").toLowerCase().includes(search) ||
      (student.phone || "").toLowerCase().includes(search)
    );
  });
    // Search and filter services
  const filteredServices = services.filter((service) => {
    const search = serviceSearch.toLowerCase();

    return (
      (service.name || "").toLowerCase().includes(search) ||
      (service.description || "").toLowerCase().includes(search)
    );
  });

  // Real dashboard values received from backend
  const stats = [
    {
      title: "Total Students",
      value: statsLoading
        ? "..."
        : statsData
          ? statsData.totalStudents.toLocaleString()
          : "—",
      change: "Live",
      description: "Registered students",
      icon: Users,
      color: "purple",
    },
    {
      title: "Waiting Students",
      value: statsLoading
        ? "..."
        : statsData
          ? statsData.waitingStudents.toLocaleString()
          : "—",
      change: "Live",
      description: "Currently in queue",
      icon: Clock3,
      color: "orange",
    },
    {
      title: "Active Counters",
      value: statsLoading
        ? "..."
        : statsData
          ? `${statsData.activeCounters}/${statsData.totalCounters}`
          : "—",
      change: "Live",
      description: "Active out of total counters",
      icon: Building2,
      color: "blue",
    },
    {
      title: "Completed Tokens",
      value: statsLoading
        ? "..."
        : statsData
          ? statsData.completedTokens.toLocaleString()
          : "—",
      change: "Live",
      description: "Completed queue tokens",
      icon: CheckCircle2,
      color: "green",
    },
  ];

  if (!admin) {
    return <Login onLogin={handleLogin} />;
  }
  // Show Staff Dashboard for staff users
if (admin.role === "staff") {
  return (
    <StaffDashboard
      staff={admin}
      onLogout={handleLogout}
    />
  );
}

// Show Student Dashboard
if (admin.role === "student") {
  return (
    <StudentDashboard
      student={admin}
      onLogout={handleLogout}
    />
  );
}

  return (
    <div className="app-container">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Ticket size={25} />
          </div>

          <div>
            <h2>CampusQueue</h2>
            <span>MANAGEMENT SYSTEM</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-label tools-label">PREFERENCES</div>

        <button
          className={`nav-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => setActivePage("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={20} />
            </div>

            <h4>Need help?</h4>
            <p>Contact support for assistance.</p>

            <button onClick={() => alert("Support information coming soon!")}>
              Get Support
            </button>
          </div>

          <div className="admin-profile">
            <div className="avatar">AD</div>

            <div className="admin-details">
              <strong>Administrator</strong>
              <span>System Admin</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="breadcrumb">Pages / {activePage}</p>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={18} />
              <input placeholder="Search anything..." />
              <span>⌘ K</span>
            </div>

            <button
              className="notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="top-profile">
              <div className="avatar">AD</div>

              <div className="top-profile-details">
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>

              <ChevronDown size={17} />
            </div>
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <h1>Welcome back, Admin! 👋</h1>
                <p>
                  Here's what's happening with your campus queue today.
                </p>
              </div>

              <button className="date-button">
                <CalendarDays size={17} />
               {new Date().toLocaleDateString("en-IN", {
                   day: "numeric",
                    month: "long",
                   year: "numeric",
              })}
                <ChevronDown size={16} />
              </button>
            </section>

            <section className="stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon size={22} />
                      </div>

                      <span className={`stat-change ${stat.color}`}>
                        {stat.change}
                      </span>
                    </div>

                    <p className="stat-title">{stat.title}</p>
                    <h2>{stat.value}</h2>

                    <span className="stat-description">
                      {stat.description}
                    </span>
                  </div>
                );
              })}
            </section>

            <section className="middle-grid">
              <div className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Queue Activity</h3>
                    <p>Students served throughout the day</p>
                  </div>

                  <button className="period-button">
                    Today <ChevronDown size={15} />
                  </button>
                </div>

                <div className="chart-summary">
  <h2>
    {analyticsLoading
      ? "..."
      : analyticsData
        ? analyticsData.todayCompleted
        : "—"}
    <span> students</span>
  </h2>

  <span className="positive-change">
    {analyticsData?.percentageChange == null
      ? "No comparison"
      : `${analyticsData.percentageChange > 0 ? "+" : ""}${analyticsData.percentageChange}% vs yesterday`}
  </span>
</div>


<div className="chart-container">
  {analyticsLoading ? (
    <div className="chart-empty-state">
      Loading queue activity...
    </div>
  ) : analyticsError ? (
    <div className="chart-empty-state">
      Unable to load queue activity.
    </div>
  ) : !chartData.some(
      (item) => Number(item.students) > 0
    ) ? (
    <div className="chart-empty-state">
      <BarChart3 size={38} />
      <h4>No queue activity yet</h4>
      <p>
        Completed student tokens will appear here throughout the day.
      </p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient
            id="queueGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#7357E8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7357E8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="#E9EAF0"
        />

        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9295A5", fontSize: 12 }}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9295A5", fontSize: 12 }}
        />

        <Tooltip />

        <Area
          type="monotone"
          dataKey="students"
          stroke="#7357E8"
          strokeWidth={3}
          fill="url(#queueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )}
</div>
</div>

              <div className="panel counter-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Counter Overview</h3>
                    <p>Current counter availability</p>
                  </div>

                  <button className="more-button" aria-label="More options">
                    <MoreHorizontal size={21} />
                  </button>
                </div>

                <div className="counter-number">
                  <h2>
                    {statsLoading
                      ? "..."
                      : statsData
                        ? statsData.totalCounters
                        : "—"}
                  </h2>

                  <span> Total counters</span>
                </div>

                <div className="counter-progress">
                  <div className="progress-track">
                    <div
                      className="progress-active"
                      style={{
                        width:
                          statsData && statsData.totalCounters > 0
                            ? `${
                                (statsData.activeCounters /
                                  statsData.totalCounters) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>

                  <div className="progress-labels">
                    <span>
                      {statsLoading
                        ? "Loading..."
                        : statsData
                          ? `${statsData.activeCounters} Active`
                          : "Unavailable"}
                    </span>

                    <span>
                      {statsData
                        ? `${
                            statsData.totalCounters -
                            statsData.activeCounters
                          } Inactive`
                        : ""}
                    </span>
                  </div>
                </div>

<div className="counter-list">
  {countersLoading ? (
    <p>Loading counters...</p>
  ) : countersError ? (
    <p>{countersError}</p>
  ) : counters.length > 0 ? (
    counters.slice(0, 4).map((counter) => {
      const isActive =
        counter.status?.toLowerCase() === "active";

      return (
        <div className="counter-row" key={counter._id}>
          <span
            className={`counter-status-dot ${
              isActive ? "active-dot" : "paused-dot"
            }`}
          />

          <span>{counter.name || "Unnamed Counter"}</span>

          <strong>{isActive ? "Active" : "Inactive"}</strong>
        </div>
      );
    })
  ) : (
    <p>No counters available.</p>
  )}
</div>



              </div>
            </section>

            <section className="panel queue-panel">
              <div className="panel-heading queue-heading">
                <div>
                  <h3>Recent Queue Activity</h3>
                  <p>Monitor recently issued student tokens</p>
                </div>

                <button
                  className="view-all-button"
                  onClick={() => setActivePage("Queue Management")}
                >
                  View All <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>TOKEN ID</th>
                      <th>STUDENT</th>
                      <th>SERVICE</th>
                      <th>COUNTER</th>
                      <th>TIME</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

<tbody>
  {queueLoading ? (
    <tr>
      <td colSpan="6">Loading recent queue records...</td>
    </tr>
  ) : queueError ? (
    <tr>
      <td colSpan="6">{queueError}</td>
    </tr>
  ) : queueTokens.length > 0 ? (
    [...queueTokens]
      .sort(
        (a, b) =>
          new Date(b.issuedAt) - new Date(a.issuedAt)
      )
      .slice(0, 4)
      .map((item) => (
        <tr key={item._id}>
          <td className="token-id">
            #{item.tokenNumber}
          </td>

          <td className="student-name">
            {item.student?.name || "Unknown Student"}
          </td>

          <td>
            {item.service?.name || "Unknown Service"}
          </td>

          <td>
            {item.counter?.name || "Not Assigned"}
          </td>

          <td>
            {item.issuedAt
              ? new Date(item.issuedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </td>

          <td>
            <span
              className={`status-badge ${item.status?.toLowerCase()}`}
            >
              {item.status}
            </span>
          </td>
        </tr>
      ))
  ) : (
    <tr>
      <td colSpan="6">No queue records available.</td>
    </tr>
  )}
</tbody></table>
              </div>
            </section>

            <footer className="dashboard-footer">
              <span>© 2026 CampusQueue Management System</span>
              <span>Made for smarter campus experiences</span>
            </footer>
          </div>
        ) : activePage === "Queue Management" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <h1>Queue Management</h1>
                <p>Monitor and manage all student queue tokens.</p>
              </div>

              <button
                className="date-button"
                onClick={() => setQueueRefresh((previous) => previous + 1)}
              >
                <ArrowUpRight size={17} />
                Refresh Queue
              </button>
            </section>

            <section className="stats-grid">
              {[
                {
                  title: "Total Tokens",
                  value: queueTokens.length,
                },
                {
                  title: "Waiting",
                  value: queueTokens.filter(
                    (token) => token.status === "waiting"
                  ).length,
                },
                {
                  title: "Serving",
                  value: queueTokens.filter(
                    (token) => token.status === "serving"
                  ).length,
                },
                {
                  title: "Completed",
                  value: queueTokens.filter(
                    (token) => token.status === "completed"
                  ).length,
                },
                {
                  title: "Skipped",
                  value: queueTokens.filter(
                    (token) => token.status === "skipped"
                  ).length,
                },
              ].map((item) => (
                <div className="stat-card" key={item.title}>
                  <p className="stat-title">{item.title}</p>
                  <h2>{item.value}</h2>
                  <span className="stat-description">
                    Live queue records
                  </span>
                </div>
              ))}
            </section>

            <section className="panel queue-panel">
              <div className="panel-heading queue-heading">
                <div>
                  <h3>All Queue Tokens</h3>
                  <p>Records retrieved from the backend database</p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  margin: "20px 0",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  placeholder="Search student or token..."
                  value={queueSearch}
                  onChange={(event) => setQueueSearch(event.target.value)}
                  style={{
                    padding: "12px",
                    border: "1px solid #E2E4EA",
                    borderRadius: "8px",
                    flex: "1",
                    minWidth: "200px",
                  }}
                />

                <select
                  value={queueFilter}
                  onChange={(event) => setQueueFilter(event.target.value)}
                  style={{
                    padding: "12px",
                    border: "1px solid #E2E4EA",
                    borderRadius: "8px",
                    minWidth: "150px",
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="waiting">Waiting</option>
                  <option value="serving">Serving</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>

              {queueLoading ? (
                <p style={{ padding: "25px" }}>Loading queue records...</p>
              ) : queueError ? (
                <p style={{ padding: "25px", color: "red" }}>
                  {queueError}
                </p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>TOKEN ID</th>
                        <th>STUDENT</th>
                        <th>SERVICE</th>
                        <th>COUNTER</th>
                        <th>STATUS</th>
                        <th>ISSUED AT</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredQueueTokens.length > 0 ? (
                        filteredQueueTokens.map((token) => (
                          <tr key={token._id}>
                            <td className="token-id">
                              {token.tokenNumber || token.token || token._id}
                            </td>

                            <td className="student-name">
                              {token.student?.name || "Unknown Student"}
                            </td>

                            <td>
                              {token.service?.name || "Unknown Service"}
                            </td>

                            <td>
                              {token.counter?.name || "Not Assigned"}
                            </td>

                            <td>
                              <span
                                className={`status-badge ${token.status?.toLowerCase()}`}
                              >
                                {token.status}
                              </span>
                            </td>

                            <td>
                              {token.issuedAt
                                ? new Date(token.issuedAt).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            style={{
                              textAlign: "center",
                              padding: "25px",
                            }}
                          >
                            No matching queue records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : activePage === "Students" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <h1>Students Management</h1>
                <p>
                  View and monitor all students registered in CampusQueue.
                </p>
              </div>

              <button
                className="date-button"
                onClick={() =>
                  setStudentsRefresh((previous) => previous + 1)
                }
              >
                <ArrowUpRight size={17} />
                Refresh Students
              </button>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple">
                    <Users size={22} />
                  </div>
                  <span className="stat-change purple">Live</span>
                </div>

                <p className="stat-title">Total Students</p>
                <h2>{studentsLoading ? "..." : students.length}</h2>
                <span className="stat-description">
                  Registered students
                </span>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green">
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="stat-change green">Live</span>
                </div>

                <p className="stat-title">Active Students</p>
                <h2>
                  {studentsLoading
                    ? "..."
                    : students.filter((student) => student.isActive).length}
                </h2>
                <span className="stat-description">
                  Currently active accounts
                </span>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange">
                    <UserRound size={22} />
                  </div>
                  <span className="stat-change orange">Live</span>
                </div>

                <p className="stat-title">Inactive Students</p>
                <h2>
                  {studentsLoading
                    ? "..."
                    : students.filter((student) => !student.isActive).length}
                </h2>
                <span className="stat-description">
                  Inactive accounts
                </span>
              </div>
            </section>

            <section className="panel queue-panel">
              <div className="panel-heading queue-heading">
                <div>
                  <h3>Registered Students</h3>
                  <p>Student records retrieved from the database</p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  margin: "20px 0",
                }}
              >
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  style={{
                    padding: "12px",
                    border: "1px solid #E2E4EA",
                    borderRadius: "8px",
                    flex: "1",
                    minWidth: "200px",
                  }}
                />
              </div>

              {studentsLoading ? (
                <p style={{ padding: "25px" }}>
                  Loading student records...
                </p>
              ) : studentsError ? (
                <p style={{ padding: "25px", color: "red" }}>
                  {studentsError}
                </p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>STUDENT NAME</th>
                        <th>EMAIL</th>
                        <th>PHONE</th>
                        <th>STATUS</th>
                        <th>REGISTERED DATE</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student._id}>
                            <td className="student-name">
                              {student.name || "—"}
                            </td>

                            <td>{student.email || "—"}</td>

                            <td>{student.phone || "—"}</td>

                            <td>
                              <span
                                className={`status-badge ${
                                  student.isActive ? "completed" : "skipped"
                                }`}
                              >
                                {student.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td>
                              {student.createdAt
                                ? new Date(
                                    student.createdAt
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            style={{
                              textAlign: "center",
                              padding: "25px",
                            }}
                          >
                            No matching students found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                          )}
            </section>
    {/* STAFF RECORDS */}
    <div style={{ marginTop: "30px" }}>
      <div className="page-header">
        <div>
          <h2>Staff Records</h2>
          <p>View all registered campus staff members.</p>
        </div>
        <span>
          Total Staff: {staffMembers.length}
        </span>
      </div>

      {staffMembers.length === 0 ? (
        <p>No staff records found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Assigned Counter</th>
                <th>Account Status</th>
                <th>Registration Date</th>
              </tr>
            </thead>

            <tbody>
              {staffMembers.map((staff) => {
                const assignedCounters = counters
                  .filter(
                    (counter) =>
                      counter.staff?._id === staff._id
                  )
                  .map((counter) => counter.name);

                return (
                  <tr key={staff._id}>
                    <td>{staff.name}</td>
                    <td>{staff.email}</td>
                    <td>{staff.phone || "Not provided"}</td>
                    <td>
                      {assignedCounters.length > 0
                        ? assignedCounters.join(", ")
                        : "Not assigned"}
                    </td>
                    <td>
                      {staff.isActive ? "Active" : "Inactive"}
                    </td>
                    <td>
                      {staff.createdAt
                        ? new Date(staff.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

          </div>
        ) : activePage === "Services" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <h1>Services Management</h1>
                <p>Manage the services available to campus students.</p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className="date-button"
                  onClick={() =>
                    setServicesRefresh((previous) => previous + 1)
                  }
                >
                  <ArrowUpRight size={17} />
                  Refresh Services
                </button>

                <button
                  className="date-button"
                  onClick={() => {
                    setShowServiceForm(!showServiceForm);
                    setServiceMessage("");
                  }}
                >
                  + Add Service
                </button>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple">
                    <Building2 size={22} />
                  </div>
                  <span className="stat-change purple">Live</span>
                </div>

                <p className="stat-title">Active Services</p>
                <h2>{servicesLoading ? "..." : services.length}</h2>
                <span className="stat-description">
                  Available campus services
                </span>
              </div>
            </section>

            {serviceMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  marginBottom: "18px",
                  borderRadius: "8px",
                  background: serviceMessage.includes("successfully")
                    ? "#E8F8EF"
                    : "#FDECEC",
                  color: serviceMessage.includes("successfully")
                    ? "#16834A"
                    : "#C0392B",
                }}
              >
                {serviceMessage}
              </div>
            )}

            {showServiceForm && (
              <section className="panel queue-panel">
                <div className="panel-heading queue-heading">
                  <div>
                    <h3>Add New Service</h3>
                    <p>Enter the details of the new campus service.</p>
                  </div>
                </div>

                <form
                  onSubmit={handleAddService}
                  style={{
                    display: "grid",
                    gap: "15px",
                    maxWidth: "600px",
                    marginTop: "20px",
                  }}
                >
                  <label>
                    Service Name *
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(event) =>
                        setServiceName(event.target.value)
                      }
                      placeholder="Example: Examination Section"
                      required
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        marginTop: "7px",
                        border: "1px solid #E2E4EA",
                        borderRadius: "8px",
                      }}
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      value={serviceDescription}
                      onChange={(event) =>
                        setServiceDescription(event.target.value)
                      }
                      placeholder="Enter service description"
                      rows="3"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        marginTop: "7px",
                        border: "1px solid #E2E4EA",
                        borderRadius: "8px",
                      }}
                    />
                  </label>

                  <label>
                    Average Service Time (minutes)
                    <input
                      type="number"
                      min="1"
                      value={averageServiceTime}
                      onChange={(event) =>
                        setAverageServiceTime(event.target.value)
                      }
                      required
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        marginTop: "7px",
                        border: "1px solid #E2E4EA",
                        borderRadius: "8px",
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      className="date-button"
                      disabled={serviceSaving}
                    >
                      {serviceSaving ? "Saving..." : "Save Service"}
                    </button>

                    <button
                      type="button"
                      className="date-button"
                      onClick={() => setShowServiceForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="panel queue-panel">
              <div className="panel-heading queue-heading">
                <div>
                  <h3>Available Services</h3>
                  <p>Active services retrieved from MongoDB.</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search services by name or description..."
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  margin: "20px 0",
                  border: "1px solid #E2E4EA",
                  borderRadius: "8px",
                }}
              />

              {servicesLoading ? (
                <p style={{ padding: "25px" }}>Loading services...</p>
              ) : servicesError ? (
                <p style={{ padding: "25px", color: "red" }}>
                  {servicesError}
                </p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>SERVICE NAME</th>
                        <th>DESCRIPTION</th>
                        <th>AVERAGE TIME</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                          <tr key={service._id}>
                            <td className="student-name">
                              {service.name}
                            </td>

                            <td>
                              {service.description || "No description"}
                            </td>

                            <td>
                              {service.averageServiceTime} minutes
                            </td>

                            <td>
                              <span className="status-badge completed">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            style={{
                              textAlign: "center",
                              padding: "25px",
                            }}
                          >
                            No matching services found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
               ) : activePage === "Counters & Staff" ? (
   <div className="page-content counters-staff-page">
    <div className="page-header">
      <div>
        <h2>Counters & Staff Management</h2>
        <p>Manage campus counters and assign staff members.</p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button
  type="button"
  className="staff-action-button"
  onClick={() => {
    setShowStaffForm(!showStaffForm);
    setStaffMessage("");
  }}
>

    {showStaffForm ? "Cancel Staff Form" : "+ Add Staff"}
  </button>

  <button
  type="button"
  className="staff-action-button"
  onClick={() => setShowCounterForm(!showCounterForm)}
>

    {showCounterForm ? "Cancel" : "+ Add Counter"}
  </button>
</div>
    </div>

    {counterMessage && (
      <p>{counterMessage}</p>
    )}

{staffMessage && (
  <p
    style={{
      padding: "12px",
      margin: "12px 0",
      borderRadius: "8px",
      background: staffMessage.toLowerCase().includes("success")
        ? "#E8F8EF"
        : "#FDECEC",
      color: staffMessage.toLowerCase().includes("success")
        ? "#16834A"
        : "#C0392B",
    }}
  >
    {staffMessage}
  </p>
)}

{showStaffForm && (
  <form
    onSubmit={handleCreateStaff}
    style={{
      display: "grid",
      gap: "16px",
      maxWidth: "600px",
      padding: "24px",
      marginBottom: "24px",
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    }}
  >
    <div>
      <h3 style={{ margin: "0 0 6px", color: "#1E293B" }}>
        Create Staff Account
      </h3>
      <p style={{ margin: 0, color: "#64748B", fontSize: "13px" }}>
        Enter the details to register a new staff member.
      </p>
    </div>

    <label style={{ display: "grid", gap: "7px", color: "#334155" }}>
      <span>Staff Name *</span>
      <input
        type="text"
        value={staffName}
        onChange={(event) => setStaffName(event.target.value)}
        placeholder="Enter staff name"
        required
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          border: "1px solid #CBD5E1",
          borderRadius: "7px",
          fontSize: "14px",
        }}
      />
    </label>

    <label style={{ display: "grid", gap: "7px", color: "#334155" }}>
      <span>Staff Email *</span>
      <input
        type="email"
        value={staffEmail}
        onChange={(event) => setStaffEmail(event.target.value)}
        placeholder="Enter staff email"
        required
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          border: "1px solid #CBD5E1",
          borderRadius: "7px",
          fontSize: "14px",
        }}
      />
    </label>

    <label style={{ display: "grid", gap: "7px", color: "#334155" }}>
      <span>Password *</span>
      <input
        type="password"
        value={staffPassword}
        onChange={(event) => setStaffPassword(event.target.value)}
        placeholder="At least 6 characters"
        minLength="6"
        required
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          border: "1px solid #CBD5E1",
          borderRadius: "7px",
          fontSize: "14px",
        }}
      />
    </label>

    <label style={{ display: "grid", gap: "7px", color: "#334155" }}>
      <span>Phone (optional)</span>
      <input
        type="tel"
        value={staffPhone}
        onChange={(event) => setStaffPhone(event.target.value)}
        placeholder="Enter phone number"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px 12px",
          border: "1px solid #CBD5E1",
          borderRadius: "7px",
          fontSize: "14px",
        }}
      />
    </label>

    <div style={{ display: "flex", gap: "12px", marginTop: "5px" }}>
      <button
        type="submit"
        className="staff-submit-button"
        disabled={staffSaving}
      >
        {staffSaving ? "Creating..." : "Create Staff"}
      </button>

      <button
        type="button"
        className="staff-cancel-button"
        onClick={() => setShowStaffForm(false)}
      >
        Cancel
      </button>
    </div>
  </form>
)}





    {showCounterForm && (
      <form onSubmit={handleAddCounter}>
        <h3>Create New Counter</h3>

        <input
          type="text"
          placeholder="Enter counter name"
          value={counterName}
          onChange={(e) => setCounterName(e.target.value)}
          required
        />

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          required
        >
          <option value="">Select Service</option>
          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
        >
          <option value="">Select Staff (Optional)</option>
          {staffMembers.map((staff) => (
            <option key={staff._id} value={staff._id}>
              {staff.name} - {staff.email}
            </option>
          ))}
        </select>

        <button type="submit" disabled={counterSaving}>
          {counterSaving ? "Creating..." : "Create Counter"}
        </button>
      </form>
    )}

    {countersLoading ? (
      <p>Loading counters...</p>
    ) : countersError ? (
      <p>{countersError}</p>
    ) : counters.length === 0 ? (
      <p>No counters found. Create your first counter.</p>
    ) : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Counter Name</th>
              <th>Service</th>
              <th>Assigned Staff</th>
              <th>Assign / Change Staff</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {counters.map((counter) => (
              <tr key={counter._id}>
                <td>{counter.name}</td>
                <td>{counter.service?.name || "Not assigned"}</td>
                <td>{counter.staff?.name || "Unassigned"}</td>

<td>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <select
    className="staff-assign-select"
      value={selectedStaffByCounter[counter._id] || ""}
      onChange={(e) =>
        setSelectedStaffByCounter((previous) => ({
          ...previous,
          [counter._id]: e.target.value,

        }))
      }
      disabled={assigningCounterId === counter._id}
    >
      <option value="">Select Staff</option>

      {staffMembers.map((staff) => (
        <option key={staff._id} value={staff._id}>
          {staff.name} - {staff.email}
        </option>
      ))}
    </select>

    <button
    className="staff-assign-button"
      type="button"
      onClick={() => handleAssignStaff(counter._id)}
      disabled={
        assigningCounterId === counter._id ||
        !selectedStaffByCounter[counter._id]
      }
    >
      {assigningCounterId === counter._id ? "Saving..." : "Assign"}
    </button>
  </div>
</td>

<td>{counter.status}</td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>
    )}

  </div>
) : activePage === "Analytics" ? (

  <div className="dashboard-content">
    <section className="welcome-section">
      <div>
        <h1>Queue Analytics</h1>
        <p>
          View queue performance and service usage statistics.
        </p>
      </div>

      <button
        className="date-button"
        onClick={() =>
          setAnalyticsRefresh((previous) => previous + 1)
        }
      >
        <ArrowUpRight size={17} />
        Refresh Analytics
      </button>
    </section>

    {analyticsLoading ? (
      <p style={{ padding: "25px" }}>
        Loading analytics data...
      </p>
    ) : analyticsError ? (
      <p style={{ padding: "25px", color: "red" }}>
        {analyticsError}
      </p>
    ) : analyticsData ? (
      <>
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon purple">
                <Ticket size={22} />
              </div>
              <span className="stat-change purple">Live</span>
            </div>
            <p className="stat-title">Total Tokens</p>
            <h2>{analyticsData.totalTokens}</h2>
            <span className="stat-description">
              Total tokens issued
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon orange">
                <Clock3 size={22} />
              </div>
              <span className="stat-change orange">Live</span>
            </div>
            <p className="stat-title">Waiting</p>
            <h2>
              {analyticsData.statusCounts.waiting}
            </h2>
            <span className="stat-description">
              Students waiting
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon green">
                <CheckCircle2 size={22} />
              </div>
              <span className="stat-change green">Live</span>
            </div>
            <p className="stat-title">Completed</p>
            <h2>
              {analyticsData.statusCounts.completed}
            </h2>
            <span className="stat-description">
              Completed tokens
            </span>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon blue">
                <Users size={22} />
              </div>
              <span className="stat-change blue">Live</span>
            </div>
            <p className="stat-title">Skipped</p>
            <h2>
              {analyticsData.statusCounts.skipped}
            </h2>
            <span className="stat-description">
              Skipped tokens
            </span>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading queue-heading">
            <div>
              <h3>Token Status Overview</h3>
              <p>Number of tokens in each status</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>TOTAL TOKENS</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(analyticsData.statusCounts).map(
                  ([status, total]) => (
                    <tr key={status}>
                      <td>
                        <span
                          className={`status-badge ${status}`}
                        >
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </span>
                      </td>
                      <td>{total}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading queue-heading">
            <div>
              <h3>Service Usage Analytics</h3>
              <p>Total tokens issued for each campus service</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SERVICE NAME</th>
                  <th>TOTAL TOKENS</th>
                </tr>
              </thead>

              <tbody>
                {analyticsData.serviceStats.length > 0 ? (
                  analyticsData.serviceStats.map((service) => (
                    <tr key={service.name}>
                      <td className="student-name">
                        {service.name}
                      </td>
                      <td>{service.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">
                      No service analytics available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading queue-heading">
            <div>
              <h3>Counter Usage Analytics</h3>
              <p>Total tokens handled by each counter</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>COUNTER NAME</th>
                  <th>TOTAL TOKENS</th>
                </tr>
              </thead>

              <tbody>
                {analyticsData.counterStats.length > 0 ? (
                  analyticsData.counterStats.map((counter) => (
                    <tr key={counter.name}>
                      <td className="student-name">
                        {counter.name}
                      </td>
                      <td>{counter.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">
                      No counter analytics available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    ) : (
      <p style={{ padding: "25px" }}>
        No analytics data available.
      </p>
    )}
  </div>
) : activePage === "Settings" ? (
  <div className="dashboard-content">
    <section className="welcome-section">
      <div>
        <h1>System Settings</h1>
        <p>Manage your administrator account and system information.</p>
      </div>
    </section>

    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <h3>Administrator Profile</h3>
          <p>Your account information</p>
        </div>
      </div>

      <div style={{ padding: "20px", lineHeight: "2.2" }}>
        <p><strong>Name:</strong> {admin?.name || "Administrator"}</p>
        <p><strong>Email:</strong> {admin?.email || "—"}</p>
        <p><strong>Role:</strong> {admin?.role || "Admin"}</p>
        <p><strong>Account Status:</strong> Active</p>
      </div>
    </section>

    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <h3>System Information</h3>
          <p>CampusQueue application details</p>
        </div>
      </div>

      <div style={{ padding: "20px", lineHeight: "2.2" }}>
        <p><strong>Application:</strong> CampusQueue</p>
        <p><strong>Platform:</strong> Campus Smart Queue Management System</p>
        <p><strong>Frontend:</strong> React.js</p>
        <p><strong>Backend:</strong> Node.js and Express.js</p>
        <p><strong>Database:</strong> MongoDB</p>
      </div>
    </section>

    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <h3>Account Security</h3>
          <p>Manage your current administrator session.</p>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <p style={{ marginBottom: "15px" }}>
          You are currently logged in as an administrator.
        </p>

        <button
          className="date-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </section>
  </div>
) : (
  <div className="placeholder-page">
    <div className="placeholder-icon">
      <LayoutDashboard size={30} />
    </div>

    <h2>{activePage}</h2>

    <p>
      This section will be developed and connected to your backend
      in the next steps.
    </p>

    <button onClick={() => setActivePage("Dashboard")}>
      Back to Dashboard
    </button>
  </div>
)}

      </main>
    </div>
  );
}

export default App;
