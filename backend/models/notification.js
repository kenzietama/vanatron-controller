const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    sensor: { type: String, required: true },
    device: { type: String, required: true },
    parameter: { type: String, required: true },
    value: { type: Number, required: true },
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    severity: { type: String, enum: ["LOW", "HIGH"], required: true },
    read: { type: Boolean, default: false },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema); 