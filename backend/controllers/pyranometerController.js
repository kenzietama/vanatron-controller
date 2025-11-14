const pyr = require ('../models/pyranometer');
const mongoose = require('mongoose');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getPyranometerData = async (req, res) => {
    const pyranometer = await mongoose.connection.db.collection('pyranometers').find({}).sort({createdAt: -1}).limit(1).toArray()
    res.status(200).json(pyranometer);
}

const getPyranometerGraph = async (req, res) => {
    const pyranometer = await mongoose.connection.db.collection('pyranometers').find({}).sort({createdAt: -1}).limit(10).toArray()
    res.status(200).json(pyranometer);
}

//post
const addPyranometerData = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'pyranometers', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!pyr.schema.path(key)) {
                pyr.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const pyranometer = await pyr.create(requestBody)

        if(response) {
            io.emit(`pyranometers${deviceId}`, pyranometer)
            emitThresholdAlerts('pyranometers', deviceId, requestBody)
        }
        res.status(200).json(pyranometer)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getPyranometerData,
    getPyranometerGraph,
    addPyranometerData
}