const mongoose = require('mongoose');
const dissolvedOxygen = require('../models/dissolvedOxygen');
const displayItem = require('../models/displayItem');
const {io} = require('../lib/socket');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

const getDO = async (req, res) => {
    try {
        const DO = await mongoose.connection.db.collection('dissolvedoxygens').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(DO)
    } catch (error) {
        console.error("Error fetching DO:", error);
        res.status(500).json({error: error.message})
    }
}

const getDOgraph = async (req, res) => {
    try {
        const DO = await mongoose.connection.db.collection('dissolvedoxygens').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(DO)
    } catch (error) {
        console.error("Error fetching DO graph:", error);
        res.status(500).json({error: error.message})
    }
}

const addDO = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params
    const response = await displayItem.find({sensor: 'dissolvedoxygens', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!dissolvedOxygen.schema.path(key)) {
                dissolvedOxygen.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const DO = await dissolvedOxygen.create(requestBody)

        if(response) {
            io.emit(`dissolvedoxygens${deviceId}`, DO)
            emitThresholdAlerts('dissolvedoxygens', deviceId, requestBody)
        }
        res.status(200).json(DO)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    getDO,
    getDOgraph,
    addDO
}