const mongoose = require("mongoose");

const controlSchema = new mongoose.Schema({
    set_point: { type: Number, required: true },
    current_value: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }
}, {timestamps: true, updatedAt: false, versionKey: false});