
const mongoose = require("mongoose");

const queueTokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    counter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Counter",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "called",
        "serving",
        "completed",
        "cancelled",
        "skipped",
      ],
      default: "waiting",
    },

    estimatedWaitTime: {
      type: Number,
      default: 0,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueToken", queueTokenSchema);
