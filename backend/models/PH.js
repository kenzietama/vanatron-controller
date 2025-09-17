const mongoose = require('mongoose');

const Schema = mongoose.Schema

const PHSchema = new Schema({
    pH: {
        type: Number,
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    }
}, {timestamps: true, versionKey: false});

module.exports = mongoose.model('PH', PHSchema);