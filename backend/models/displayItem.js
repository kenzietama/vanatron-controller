const mongoose = require("mongoose");

const displaySchema = new mongoose.Schema({
    displayName: { type: String, required: true },
    sensor: { type: String, required: true },
    device: { type: String, required: true },
    parameter: { type: String, required: true },
    unit: { type: String, required: true },
    socket: { type: String, required: true },
    minValue: { type: Number, required: true }, // nilai minimum opsional
    maxValue: { type: Number, required: true }  // nilai maksimum opsional
});

module.exports = mongoose.model("DisplayItem", displaySchema);
