const mongoose = require('mongoose')
const ph = require ('../models/PH');   // ubah ws -> ph
const {io} = require('../lib/socket');
const displayItem = require('../models/displayItem')
const { emitThresholdAlerts } = require('../lib/thresholdNotifier.js');

const getPH = async (req, res) => {
    try {
        const PH = await mongoose.connection.db.collection('phs').find({}).sort({createdAt: -1}).limit(1).toArray() // ubah weatherstations -> phs
        res.status(200).json(PH)
    } catch (error) {
        console.error("Error fetching pH :", error);
        res.status(500).json({error: error.message})
    }
}

const getPHgraph = async (req, res) => {
    try {
        const PH = await mongoose.connection.db.collection('phs').find({}).sort({createdAt: -1}).limit(10).toArray() // ubah weatherstations -> phs
        res.status(200).json(PH)
    } catch (error) {
        console.error("Error fetching pH :", error);
        res.status(500).json({error: error.message})
    }
}

const addPH = async (req, res) => {
    const requestBody = req.body
    const { deviceId } = req.params

    const response = await displayItem.find({sensor: 'pH', device: deviceId}).limit(1)

    try {
        requestBody.deviceId = deviceId
        for (const key in requestBody) {
            if (!ph.schema.path(key)) {   // ubah ws -> ph
                ph.schema.add({
                    [key]: {
                        type: Number
                    }
                })
            }
        }
        const PH = await ph.create(requestBody)  // ubah ws -> ph

        if(response) {
            io.emit(`pH${deviceId}`, PH)
            emitThresholdAlerts('pH', deviceId, requestBody)
        }

        res.status(200).json(PH)   // ubah WS -> PH
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

module.exports = {
    getPH,
    getPHgraph,
    addPH
}