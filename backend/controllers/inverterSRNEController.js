const mongoose = require('mongoose');
const inverterSRNE = require('../models/inverterSRNE');
const {io} = require('../lib/socket');
const displayItem = require("../models/displayItem");
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

const getInverterSRNE = async (req, res) => {
    try {
        const InverterSRNE = await mongoose.connection.db.collection('invertersrnes').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(InverterSRNE)
    } catch (error) {
        console.error("Error fetching Inverter SRNE:", error);
        res.status(500).json({error: error.message})
    }
}

const getInverterSRNEgraph = async (req, res) => {
    try {
        const InverterSRNE = await mongoose.connection.db.collection('invertersrnes').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(InverterSRNE)
    } catch (error) {
        console.error("Error fetching Inverter SRNE graph:", error);
        res.status(500).json({error: error.message})
    }
}

const addInverterSRNE = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'invertersrnes', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!inverterSRNE.schema.path(key)) {
                inverterSRNE.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const InverterSRNE = await inverterSRNE.create(requestBody)

        if(response) {
            io.emit(`invertersrnes${deviceId}`, InverterSRNE)
            emitThresholdAlerts('invertersrnes', deviceId, requestBody)
        }

        res.status(200).json(InverterSRNE)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    getInverterSRNE,
    getInverterSRNEgraph,
    addInverterSRNE
}