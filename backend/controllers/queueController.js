
const mongoose = require("mongoose");
const QueueToken = require("../models/QueueToken");
const QueueSequence = require("../models/QueueSequence");
const Service = require("../models/Service");
const Counter = require("../models/Counter");

// Helper: SEND REAL-TIME QUEUE UPDATES
const emitQueueUpdate = (req, token, counter, eventName) => {
  const io = req.app.get("io");

  if (!io) return;

  const studentId = token.student?._id || token.student;
  const counterId = counter?._id || counter;

  const eventData = {
    event: eventName,
    tokenId: token._id,
    tokenNumber: token.tokenNumber,
    status: token.status,
    studentId: studentId?.toString(),
    counterId: counterId?.toString(),
    serviceId: token.service?._id?.toString() ||
      token.service?.toString(),
    updatedAt: new Date(),
  };

  if (studentId) {
    io.to(`student:${studentId}`).emit("queue-updated", eventData);
  }

  if (counterId) {
    io.to(`counter:${counterId}`).emit("queue-updated", eventData);
  }
};

// STUDENT: JOIN A QUEUE
exports.joinQueue = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const studentId = req.user._id;

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
        message: "Service not found or inactive",
      });
    }

    const existingToken = await QueueToken.findOne({
      student: studentId,
      service: serviceId,
      status: { $in: ["waiting", "called", "serving"] },
    });

    if (existingToken) {
      return res.status(409).json({
        success: false,
        message: "You already have an active token for this service",
        token: existingToken,
      });
    }

    const now = new Date();

    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const sequence = await QueueSequence.findOneAndUpdate(
      { service: serviceId, dateKey },
      { $inc: { lastNumber: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const tokenNumber = sequence.lastNumber;

    const dateStart = new Date(`${dateKey}T00:00:00+05:30`);
    const dateEnd = new Date(dateStart.getTime() + 86400000);

    const waitingCount = await QueueToken.countDocuments({
      service: serviceId,
      status: "waiting",
      issuedAt: {
        $gte: dateStart,
        $lt: dateEnd,
      },
    });

    const estimatedWaitTime =
      waitingCount * service.averageServiceTime;

    const counter = await Counter.findOne({
      service: serviceId,
      status: "active",
    }).sort({ createdAt: 1 });

    const token = await QueueToken.create({
      tokenNumber,
      student: studentId,
      service: serviceId,
      counter: counter ? counter._id : null,
      estimatedWaitTime,
    });

    // Notify student and assigned counter
    emitQueueUpdate(req, token, counter, "token-created");

    res.status(201).json({
      success: true,
      message: "Queue token generated successfully",
      token,
      queuePosition: waitingCount + 1,
    });
  } catch (error) {
    console.error("Join queue error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to join queue",
    });
  }
};

// STUDENT: VIEW MY ACTIVE TOKENS
exports.getMyTokens = async (req, res) => {
  try {
    const tokens = await QueueToken.find({
      student: req.user._id,
      status: { $in: ["waiting", "called", "serving"] },
    })
      .populate("service", "name averageServiceTime")
      .populate("counter", "name status")
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      count: tokens.length,
      tokens,
    });
  } catch (error) {
    console.error("Get my tokens error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch your tokens",
    });
  }
};

// STUDENT: VIEW COMPLETE TOKEN HISTORY
exports.getMyTokenHistory = async (req, res) => {
  try {
    const tokens = await QueueToken.find({
      student: req.user._id,
    })
      .populate("service", "name")
      .populate("counter", "name")
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      count: tokens.length,
      tokens,
    });
  } catch (error) {
    console.error("Get student token history error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch token history",
    });
  }
};

// STAFF: VIEW STUDENTS IN ASSIGNED COUNTER QUEUE

// STAFF: VIEW STUDENTS IN A SELECTED COUNTER QUEUE
exports.getCounterQueue = async (req, res) => {
  try {
    const { counterId } = req.query;

    if (!mongoose.isValidObjectId(counterId)) {
      return res.status(400).json({
        success: false,
        message: "Valid counter ID is required",
      });
    }

    // Verify that this counter belongs to the logged-in staff member
    const counter = await Counter.findOne({
      _id: counterId,
      staff: req.user._id,
    }).populate("service", "name averageServiceTime");

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Assigned counter not found",
      });
    }

    const tokens = await QueueToken.find({
      counter: counter._id,
      status: { $in: ["waiting", "called", "serving"] },
    })
      .populate("student", "name email phone")
      .populate("service", "name")
      .sort({ issuedAt: 1 });

    const waitingCount = tokens.filter(
      (token) => token.status === "waiting"
    ).length;

    res.status(200).json({
      success: true,
      counter: {
        id: counter._id,
        name: counter.name,
        status: counter.status,
        currentToken: counter.currentToken,
        service: counter.service,
      },
      totalActiveTokens: tokens.length,
      waitingCount,
      tokens,
    });
  } catch (error) {
    console.error("Get counter queue error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch counter queue",
    });
  }
};

// STAFF: CALL THE NEXT WAITING STUDENT

// STAFF: CALL THE NEXT WAITING STUDENT IN SELECTED COUNTER
exports.callNext = async (req, res) => {
  try {
    const { counterId } = req.body;

    if (!mongoose.isValidObjectId(counterId)) {
      return res.status(400).json({
        success: false,
        message: "Valid counter ID is required",
      });
    }

    // Verify counter ownership
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

    if (counter.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Your counter is currently not active",
      });
    }

    const currentToken = await QueueToken.findOne({
      counter: counter._id,
      status: { $in: ["called", "serving"] },
    });

    if (currentToken) {
      return res.status(409).json({
        success: false,
        message: "Please complete the current student before calling the next",
        currentToken,
      });
    }

    const token = await QueueToken.findOneAndUpdate(
      {
        counter: counter._id,
        status: "waiting",
      },
      {
        $set: { status: "called" },
      },
      {
        new: true,
        sort: { issuedAt: 1 },
      }
    )
      .populate("student", "name email phone")
      .populate("service", "name");

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "No students are waiting in your queue",
      });
    }

    counter.currentToken = token.tokenNumber;
    await counter.save();

    emitQueueUpdate(req, token, counter, "token-called");

    res.status(200).json({
      success: true,
      message: "Next student called successfully",
      token,
      counter: {
        id: counter._id,
        name: counter.name,
        currentToken: counter.currentToken,
      },
    });
  } catch (error) {
    console.error("Call next error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to call the next student",
    });
  }
};

// STAFF: UPDATE TOKEN STATUS

// STAFF: UPDATE TOKEN STATUS IN AN ASSIGNED COUNTER
exports.updateTokenStatus = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(tokenId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid token ID",
      });
    }

    const allowedStatuses = ["serving", "completed", "skipped"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use serving, completed or skipped",
      });
    }

    // Find the token first
    const token = await QueueToken.findById(tokenId);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }

    // Verify that the token belongs to one of this staff member's counters
    const counter = await Counter.findOne({
      _id: token.counter,
      staff: req.user._id,
    });

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Token not found in your assigned counters",
      });
    }

    if (status === "serving" && token.status !== "called") {
      return res.status(400).json({
        success: false,
        message: "Only called tokens can be marked as serving",
      });
    }

    if (status === "completed" && token.status !== "serving") {
      return res.status(400).json({
        success: false,
        message: "Only serving tokens can be completed",
      });
    }

   if (
  status === "skipped" &&
  token.status !== "called" &&
  token.status !== "serving"
) {
  return res.status(400).json({
    success: false,
    message: "Only called or serving tokens can be skipped",
  });
}

    token.status = status;

    if (status === "completed") {
      token.completedAt = new Date();
    }

    await token.save();

    if (status === "completed" || status === "skipped") {
      counter.currentToken = 0;
      await counter.save();
    }

    emitQueueUpdate(req, token, counter, `token-${status}`);

    res.status(200).json({
      success: true,
      message: `Token marked as ${status} successfully`,
      token,
      counter: {
        id: counter._id,
        name: counter.name,
        currentToken: counter.currentToken,
      },
    });
  } catch (error) {
    console.error("Update token status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update token status",
    });
  }
};

// ADMIN: VIEW ALL QUEUE TOKENS
exports.getAllQueueTokens = async (req, res) => {
  try {
    const tokens = await QueueToken.find()
      .populate("student", "name email phone")
      .populate("service", "name")
      .populate("counter", "name status")
      .sort({ issuedAt: -1 });

    const totalTokens = tokens.length;

    const waitingCount = tokens.filter(
      (token) => token.status === "waiting"
    ).length;

    const servingCount = tokens.filter(
      (token) => token.status === "serving"
    ).length;

    const completedCount = tokens.filter(
      (token) => token.status === "completed"
    ).length;

    res.status(200).json({
      success: true,
      totalTokens,
      waitingCount,
      servingCount,
      completedCount,
      tokens,
    });
  } catch (error) {
    console.error("Admin queue error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch all queue tokens",
    });
  }
};

