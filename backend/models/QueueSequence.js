
const mongoose = require("mongoose");

const queueSequenceSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    lastNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

queueSequenceSchema.index(
  { service: 1, dateKey: 1 },
  { unique: true }
);

module.exports = mongoose.model("QueueSequence", queueSequenceSchema);
