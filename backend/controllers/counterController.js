
const mongoose = require("mongoose");
const Counter = require("../models/Counter");
const Service = require("../models/Service");
const User = require("../models/User");
const QueueToken = require("../models/QueueToken");

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
    console.error("Get counters error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch counters",
    });
  }
};

// Admin: Assign staff to counter
// Also assign existing waiting tokens to that counter
exports.assignStaff = async (req, res) => {
  try {
    const { counterId } = req.params;
    const { staffId } = req.body;

    if (
      !mongoose.isValidObjectId(counterId) ||
      !mongoose.isValidObjectId(staffId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid counter ID or staff ID",
      });
    }

    const counter = await Counter.findById(counterId);

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    const staff = await User.findOne({
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

    // Assign staff to counter
    counter.staff = staff._id;
    await counter.save();

    // Assign existing waiting tokens to this counter
    const updateResult = await QueueToken.updateMany(
      {
        service: counter.service,
        counter: null,
        status: "waiting",
      },
      {
        $set: {
          counter: counter._id,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Staff assigned to counter successfully",
      assignedTokens: updateResult.modifiedCount,
      counter,
    });
  } catch (error) {
    console.error("Assign staff error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to assign staff",
    });
  }
};

// STAFF: GET ALL MY ASSIGNED COUNTERS
exports.getMyCounter = async (req, res) => {
  try {
    const counters = await Counter.find({
      staff: req.user._id,
    })
      .populate("service", "name description averageServiceTime")
      .populate("staff", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: counters.length,
      counters,
    });
  } catch (error) {
    console.error("Get my counters error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch assigned counters",
    });
  }
};
// STAFF: PAUSE OR RESUME ASSIGNED COUNTER
// STAFF: PAUSE OR RESUME A SELECTED COUNTER
exports.updateCounterStatus = async (req, res) => {
  try {
    const { status, counterId } = req.body;

    if (!mongoose.isValidObjectId(counterId)) {
      return res.status(400).json({
        success: false,
        message: "Valid counter ID is required",
      });
    }

    if (!["active", "paused"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or paused",
      });
    }

    // Only allow staff to update their own assigned counter
    const counter = await Counter.findOne({
      _id: counterId,
      staff: req.user._id,
    });

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Assigned counter not found",
      });
    }

    counter.status = status;
    await counter.save();

    res.status(200).json({
      success: true,
      message: `Counter ${status} successfully`,
      counter: {
        id: counter._id,
        name: counter.name,
        status: counter.status,
        currentToken: counter.currentToken,
      },
    });
  } catch (error) {
    console.error("Update counter status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update counter status",
    });
  }
};