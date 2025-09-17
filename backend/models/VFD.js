const mongoose = require('mongoose');

const Schema = mongoose.Schema

const VFDSchema = new Schema({
    running_frequency: {
        type: Number,
        required: true,
    },
    set_frequency: {
        type: Number,
        required: true,
    },
    output_voltage: {
        type: Number,
        required: true,
    },
    output_current: {
        type: Number,
        required: true,
    },
    output_power: {
        type: Number,
        required: true,
    },
    output_torque: {
        type: Number,
        required: true,
    },
    accumulative_poweron_time: {
        type: Number,
        required: true,
    },
    accumulative_running_time: {
        type: Number,
        required: true,
    },
    pulse_input_frequency: {
        type: Number,
        required: true,
    },
    main_frequency_x: {
        type: Number,
        required: true,
    },
    target_torque: {
        type: Number,
        required: true,
    },
    power_factor_angle: {
        type: Number,
        required: true,
    },
    target_voltage_upon_vf_separation: {
        type: Number,
        required: true,
    },
    output_voltage_upon_vf_separation: {
        type: Number,
        required: true,
    },
    fault_information: {
        type: Number,
        required: true,
    },
    current_set_frequency: {
        type: Number,
        required: true,
    },
    current_running_frequency: {
        type: Number,
        required: true,
    },
    ac_drive_running_state: {
        type: Number,
        required: true,
    },
    current_fault_code: {
        type: Number,
        required: true,
    },
    torque_upper_limit: {
        type: Number,
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    }
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('VFD', VFDSchema)