const rtd = require ('../models/RTD');
const mongoose = require('mongoose');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getRTDData = async (req, res) => {
    try {
        const RTD = await mongoose.connection.db.collection('rtds').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(RTD);
    } catch (error) {
        console.error("Error fetching RTD Data:", error);
        res.status(500).json({error: error.message})
    }
}

const getRTDGraph = async (req, res) => {
    try {
        const RTD = await mongoose.connection.db.collection('rtds').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(RTD);
    } catch (error) {
        console.error("Error fetching RTD Graph:", error);
        res.status(500).json({error: error.message})
    }
}

//post
const addRTDData = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'rtds', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!rtd.schema.path(key)) {
                rtd.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const RTD = await rtd.create(requestBody)

        if(response) {
            io.emit(`rtds${deviceId}`, RTD)
            emitThresholdAlerts('rtds', deviceId, requestBody)
        }
        res.status(200).json(RTD)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getRTDData,
    getRTDGraph,
    addRTDData
}

