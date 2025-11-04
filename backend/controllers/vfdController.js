const mongoose = require('mongoose');
const vfd = require ('../models/VFD');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem')
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

//get
const getVFD = async (req, res) => {
    try {
        const VFD = await mongoose.connection.db.collection('vfds').find({}).sort({createdAt: -1}).limit(1).toArray()
        res.status(200).json(VFD)
    } catch (error) {
        console.error("Error fetching VFD :", error);
        res.status(500).json({error: error.message})
    }
}

const getVFDgraph = async (req, res) => {
    try {
        const VFD = await mongoose.connection.db.collection('vfds').find({}).sort({createdAt: -1}).limit(10).toArray()
        res.status(200).json(VFD)
    } catch (error) {
        console.error("Error fetching VFD :", error);
        res.status(500).json({error: error.message})
    }
}

const addVFD = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'vfds', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!vfd.schema.path(key)) {
                vfd.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const VFD = await vfd.create(requestBody)

        if(response) {
            io.emit(`vfds${deviceId}`, VFD)
            emitThresholdAlerts('vfds', deviceId, requestBody)
        }

        res.status(200).json(VFD)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    getVFD,
    getVFDgraph,
    addVFD
}