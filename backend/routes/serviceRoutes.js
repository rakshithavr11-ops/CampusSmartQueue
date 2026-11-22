
const express = require("express");
const router = express.Router();

const {
  getServices,
  createService,
} = require("../controllers/serviceController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Any logged-in user can view services
router.get("/", protect, getServices);

// Only admins can create services
router.post("/", protect, authorize("admin"), createService);

module.exports = router;
