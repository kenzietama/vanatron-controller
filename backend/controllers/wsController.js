const mongoose = require('mongoose')
const ws = require ('../models/weatherStation');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem')
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

const getWS = async (req, res) => {
    try {
        const WS = await mongoose.connection.db.collection('weatherstations').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(WS)
    } catch (error) {
        console.error("Error fetching Weather Station :", error);
        res.status(500).json({error: error.message})
    }
}

const getWSgraph = async (req, res) => {
    try {
        const WS = await mongoose.connection.db.collection('weatherstations').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(WS)
    } catch (error) {
        console.error("Error fetching Weather Station :", error);
        res.status(500).json({error: error.message})
    }
}

const addWS = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'weatherstations', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!ws.schema.path(key)) {
                ws.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const WS = await ws.create(requestBody)

        if(response) {
            io.emit(`weatherstations${deviceId}`, WS)
            emitThresholdAlerts('weatherstations', deviceId, requestBody)
        }

        res.status(200).json(WS)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    getWS,
    getWSgraph,
    addWS
}