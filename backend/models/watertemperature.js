const mongoose = require('mongoose');

const Schema = mongoose.Schema

const watertemperatureSchema = new Schema({
    water_temperature: {
        type: Number,
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    }
}, {timestamps: true, versionKey: false});

module.exports = mongoose.model('watertemperature', watertemperatureSchema);