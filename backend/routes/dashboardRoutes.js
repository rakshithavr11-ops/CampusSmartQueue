
const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAnalytics,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Admin dashboard statistics
router.get(
  "/stats",
  protect,
  authorize("admin"),
  getDashboardStats
);

// Admin analytics data
router.get(
  "/analytics",
  protect,
  authorize("admin"),
  getAnalytics
);

module.exports = router;
