const express = require('express');
const router = express.Router();
const {
    getSalinityData,
    getSalinityGraph,
    addSalinityData
} = require('../controllers/salinityController')


//get
router.get('/', getSalinityData);

router.get('/graph', getSalinityGraph)

//post
router.post('/:deviceId', addSalinityData);

module.exports = router;