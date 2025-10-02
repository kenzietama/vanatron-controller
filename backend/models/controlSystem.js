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
    power_set_point: { type: Number, required: true },
    do_set_point: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }
    }, {
    timestamps: true,
    updatedAt: false,
    versionKey: false
});

module.exports = mongoose.model( "ControlSystem", controlSystemSchema);