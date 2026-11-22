
const mongoose = require("mongoose");
const Counter = require("../models/Counter");
const Service = require("../models/Service");
const User = require("../models/User");

// Create a counter (Admin only)
exports.createCounter = async (req, res) => {
  try {
    const { name, serviceId, staffId } = req.body;

    if (!name || !name.trim() || !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Counter name and service ID are required",
      });
    }

    if (!mongoose.isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Active service not found",
      });
    }

    let staff = null;

    if (staffId) {
      if (!mongoose.isValidObjectId(staffId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff ID",
        });
      }

      staff = await User.findOne({
        _id: staffId,
        role: "staff",
        isActive: true,
      });

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Active staff account not found",
        });
      }
    }

    const counter = await Counter.create({
      name: name.trim(),
      service: serviceId,
      staff: staff ? staff._id : null,
    });

    res.status(201).json({
      success: true,
      message: "Counter created successfully",
      counter,
    });
  } catch (error) {
    console.error("Create counter error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create counter",
    });
  }
};

// Get all counters
exports.getCounters = async (req, res) => {
  try {
    const counters = await Counter.find()
      .populate("service", "name")
      .populate("staff", "name email");

    res.status(200).json({
      success: true,
      count: counters.length,
      counters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch counters",
    });
  }
};
