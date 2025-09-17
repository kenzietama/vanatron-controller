const wtrtemp = require ('../models/watertemperature');
const mongoose = require('mongoose');
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem');

//get
const getWatertemperatureData = async (req, res) => {
    const watertemperature = await mongoose.connection.db.collection('watertemperature').find({}).sort({createdAt: -1}).limit(1).toArray()
    res.status(200).json(watertemperature);
}

const getWatertemperatureGraph = async (req, res) => {
    const watertemperature = await mongoose.connection.db.collection('watertemperature').find({}).sort({createdAt: -1}).limit(10).toArray()
    res.status(200).json(watertemperature);
}

//post
const addWatertemperatureData = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'watertemperature', device: deviceId}).limit(1)

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
        const watertemperature = await wtrtemp.create(requestBody)

        if(response) {
            io.emit(`watertemperature${deviceId}`, watertemperature)
        }
        res.status(200).json(watertemperature)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}


module.exports = {
    getWatertemperatureData,
    getWatertemperatureGraph,
    addWatertemperatureData
}