const sal = require ('../models/salinity');
const mongoose = require('mongoose');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getSalinity = async (req, res) => {
    try {
        const salinity = await mongoose.connection.db.collection('salinities').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(salinity);
    } catch (error) {
        console.error("Error fetching Salinity:", error);
        res.status(500).json({error: error.message})
    }
}

const getSalinityGraph = async (req, res) => {
    try {
        const salinity = await mongoose.connection.db.collection('salinities').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(salinity);
    } catch (error) {
        console.error("Error fetching Salinity Graph:", error);
        res.status(500).json({error: error.message})
    }
}

//post
const addSalinity = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'salinities', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!sal.schema.path(key)) {
                sal.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const salinity = await sal.create(requestBody)

        if(response) {
            io.emit(`salinities${deviceId}`, salinity)
            emitThresholdAlerts('salinities', deviceId, requestBody)
        }
        res.status(200).json(salinity)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getSalinity,
    getSalinityGraph,
    addSalinity
}