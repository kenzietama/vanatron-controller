const express = require('express');
const router = express.Router();
const {
    getSalinity,
    getSalinityGraph,
    addSalinity
} = require('../controllers/salinityController')


//get
router.get('/', getSalinity);

router.get('/graph', getSalinityGraph)

//post
router.post('/:deviceId', addSalinity);

module.exports = router;