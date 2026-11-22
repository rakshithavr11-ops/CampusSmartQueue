
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An admin account already exists.");
      return;
    }
    if (!process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD is not configured");
}

    const admin = await User.create({
      name: "Campus Admin",
      email: "admin@campusqueue.com",
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("Admin account created successfully!");
    console.log("Email:", admin.email);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
