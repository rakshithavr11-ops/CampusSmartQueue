
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

      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = 0;
      }

      if (!counterStats[counterName]) {
        counterStats[counterName] = 0;
      }

      serviceStats[serviceName]++;
      counterStats[counterName]++;
    });

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
          ([name, total]) => ({
            name,
            total,
          })
        ),

        counterStats: Object.entries(counterStats).map(
          ([name, total]) => ({
            name,
            total,
          })
        ),
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
