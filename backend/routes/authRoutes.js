
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  createStaff,
  getAllStudents,
  getAllStaff,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Admin-only staff creation
router.post("/create-staff", protect, authorize("admin"), createStaff);
// Admin-only student list
router.get("/students", protect, authorize("admin"), getAllStudents);
router.get("/staff", protect, authorize("admin"), getAllStaff);

module.exports = router;
