
const express = require("express");
const router = express.Router();
const {
  joinQueue,
  getMyTokens,
  getMyTokenHistory,
  getCounterQueue,
  callNext,
  updateTokenStatus,
  getAllQueueTokens,
} = require("../controllers/queueController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Student: Join a queue
router.post("/join", protect, joinQueue);

// Student: View their active tokens
router.get("/my-tokens", protect, getMyTokens);
// Student: View complete token history
router.get(
  "/my-history",
  protect,
  authorize("student"),
  getMyTokenHistory
);

// Staff: View assigned counter queue
router.get(
  "/counter",
  protect,
  authorize("staff"),
  getCounterQueue
);

// Staff: Call next waiting student
router.post(
  "/call-next",
  protect,
  authorize("staff"),
  callNext
);

// Staff: Update token status
router.put(
  "/:tokenId/status",
  protect,
  authorize("staff"),
  updateTokenStatus
);
// Admin: View all queue tokens
router.get(
  "/all",
  protect,
  authorize("admin"),
  getAllQueueTokens
);
module.exports = router;
