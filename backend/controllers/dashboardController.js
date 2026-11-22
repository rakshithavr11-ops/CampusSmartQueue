
const User = require("../models/User");
const Service = require("../models/Service");
const Counter = require("../models/Counter");
const QueueToken = require("../models/QueueToken");

// Existing dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      waitingStudents,
      activeCounters,
      totalCounters,
      completedTokens,
      totalServices,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      QueueToken.countDocuments({ status: "waiting" }),
      Counter.countDocuments({ status: "active" }),
      Counter.countDocuments(),
      QueueToken.countDocuments({ status: "completed" }),
      Service.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        waitingStudents,
        activeCounters,
        totalCounters,
        completedTokens,
        totalServices,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics",
    });
  }
};

// New analytics statistics

const getAnalytics = async (req, res) => {
  try {
    const statuses = [
      "waiting",
      "called",
      "serving",
      "completed",
      "cancelled",
      "skipped",
    ];

    const statusCounts = await Promise.all(
      statuses.map((status) =>
        QueueToken.countDocuments({ status })
      )
    );

    const tokens = await QueueToken.find()
      .populate("service", "name")
      .populate("counter", "name")
      .lean();

    const serviceStats = {};
    const counterStats = {};

    tokens.forEach((token) => {
      const serviceName = token.service?.name || "Unknown Service";
      const counterName = token.counter?.name || "Unassigned";

      serviceStats[serviceName] =
        (serviceStats[serviceName] || 0) + 1;

      counterStats[counterName] =
        (counterStats[counterName] || 0) + 1;
    });

    // Calculate today's and yesterday's dates in India
    const timeZone = "Asia/Kolkata";

    const getDateKey = (date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);

    const todayKey = getDateKey(new Date());

    const yesterdayDate = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );
    const yesterdayKey = getDateKey(yesterdayDate);

    // Count completed tokens by hour
    const hourlyActivity = Array.from(
      { length: 24 },
      (_, hour) => ({
        time: `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`,
        students: 0,
      })
    );

    let todayCompleted = 0;
    let yesterdayCompleted = 0;

    tokens.forEach((token) => {
      if (
        token.status !== "completed" ||
        !token.completedAt
      ) {
        return;
      }

      const completedDate = new Date(token.completedAt);
      const dateKey = getDateKey(completedDate);

      if (dateKey === todayKey) {
        todayCompleted++;

        const hour = Number(
          new Intl.DateTimeFormat("en-IN", {
            timeZone,
            hour: "2-digit",
            hourCycle: "h23",
          }).format(completedDate)
        );

        hourlyActivity[hour].students++;
      }

      if (dateKey === yesterdayKey) {
        yesterdayCompleted++;
      }
    });

    const percentageChange =
      yesterdayCompleted === 0
        ? null
        : Number(
            (
              ((todayCompleted - yesterdayCompleted) /
                yesterdayCompleted) *
              100
            ).toFixed(1)
          );

    res.status(200).json({
      success: true,
      analytics: {
        totalTokens: tokens.length,

        statusCounts: Object.fromEntries(
          statuses.map((status, index) => [
            status,
            statusCounts[index],
          ])
        ),

        serviceStats: Object.entries(serviceStats).map(
          ([name, total]) => ({ name, total })
        ),

        counterStats: Object.entries(counterStats).map(
          ([name, total]) => ({ name, total })
        ),

        todayCompleted,
        yesterdayCompleted,
        percentageChange,
        hourlyActivity,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load analytics",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
};
