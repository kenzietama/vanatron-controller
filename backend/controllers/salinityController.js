const sal = require ('../models/salinity');
const mongoose = require('mongoose');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getSalinityData = async (req, res) => {
    const salinity = await mongoose.connection.db.collection('salinity').find({}).sort({createdAt: -1}).limit(1).toArray()
    res.status(200).json(salinity);
}

const getSalinityGraph = async (req, res) => {
    const salinity = await mongoose.connection.db.collection('salinity').find({}).sort({createdAt: -1}).limit(10).toArray()
    res.status(200).json(salinity);
}

//post
const addSalinityData = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'salinity', device: deviceId}).limit(1)

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
            io.emit(`salinity${deviceId}`, salinity)
            emitThresholdAlerts('salinity', deviceId, requestBody)
        }
        res.status(200).json(salinity)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getSalinityData,
    getSalinityGraph,
    addSalinityData
}