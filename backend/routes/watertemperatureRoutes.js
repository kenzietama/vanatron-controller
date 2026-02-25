const express = require('express');
const router = express.Router();
const {
    getWatertemperature,
    getWatertemperatureGraph,
    addWatertemperature
} = require('../controllers/watertemperatureController')


//get
router.get('/', getWatertemperature);

router.get('/graph', getWatertemperatureGraph)

//post
router.post('/:deviceId', addWatertemperature);

module.exports = router;