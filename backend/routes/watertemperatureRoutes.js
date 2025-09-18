const express = require('express');
const router = express.Router();
const {
    getWatertemperatureData,
    getWatertemperatureGraph,
    addWatertemperatureData
} = require('../controllers/watertemperatureController')


//get
router.get('/', getWatertemperatureData);

router.get('/graph', getWatertemperatureGraph)

//post
router.post('/:deviceId', addWatertemperatureData);

module.exports = router;