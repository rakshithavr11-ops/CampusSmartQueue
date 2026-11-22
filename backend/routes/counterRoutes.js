
const express = require("express");
const router = express.Router();
const {
  createCounter,
  getCounters,
  assignStaff,
  getMyCounter,
  updateCounterStatus
} = require("../controllers/counterController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// View all counters (logged-in users)
router.get("/", protect, getCounters);

// Staff: View their assigned counter
router.get(
  "/my-counters",
  protect,
  authorize("staff"),
  getMyCounter
);

// Admin: Create a counter
router.post(
  "/",
  protect,
  authorize("admin"),
  createCounter
);

// Admin: Assign staff to a counter
router.put(
  "/:counterId/assign-staff",
  protect,
  authorize("admin"),
  assignStaff
);
router.put(
  "/my-counters/status",
  protect,
  authorize("staff"),
  updateCounterStatus
);

module.exports = router;
