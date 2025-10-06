const mongoose = require("mongoose");

const controlSystemSchema = new mongoose.Schema({
    state: {
        type: String,
        enum: ['on', 'off'],
        required: true
    },
    mode: {
        type: String,
        enum: ['manual', 'auto'],
        required: true
    },
    power_set_point: {
        type: Number,
        required: true,
        min: [30, 'Power set point must be at least 30%'],
        max: [100, 'Power set point cannot exceed 100%']
    },
    do_set_point: {
        type: Number,
        required: true,
        min: [4, 'DO set point must be at least 4 mg/L'],
        max: [10, 'DO set point cannot exceed 10 mg/L']
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }
}, {
    timestamps: true,
    updatedAt: false,
    versionKey: false
});

module.exports = mongoose.model("ControlSystem", controlSystemSchema);