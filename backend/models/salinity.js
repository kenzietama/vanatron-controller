const mongoose = require('mongoose');

const Schema = mongoose.Schema

const salinitySchema = new Schema({
    salinity: {
        type: Number,
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    }
}, {timestamps: true, versionKey: false});

module.exports = mongoose.model('salinity', salinitySchema);