const mongoose = require('mongoose');
const wtrtemp = require ('../models/watertemperature');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getWatertemperature = async (req, res) => {
    try {
        const Watertemperature = await mongoose.connection.db.collection('watertemperatures').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(Watertemperature);
    } catch (error) {
        console.error("Error fetching Water Temperature :", error);
        res.status(500).json({error: error.message})
    }
}

const getWatertemperatureGraph = async (req, res) => {
    try {
        const Watertemperature = await mongoose.connection.db.collection('watertemperatures').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(Watertemperature);
    } catch (error) {
        console.error("Error fetching Water Temperature :", error);
        res.status(500).json({error: error.message})
    }
}


//post
const addWatertemperature = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'watertemperatures', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!wtrtemp.schema.path(key)) {
                wtrtemp.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const Watertemperature = await wtrtemp.create(requestBody)

        if(response) {
            io.emit(`watertemperatures${deviceId}`, Watertemperature)
            emitThresholdAlerts('watertemperatures', deviceId, requestBody)
        }
        res.status(200).json(Watertemperature)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getWatertemperature,
    getWatertemperatureGraph,
    addWatertemperature
}