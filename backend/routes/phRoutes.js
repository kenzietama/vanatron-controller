const express = require('express');
const {
    getPH,
    getPHgraph,
    addPH
} = require('../controllers/phController');

const router = express.Router();

//get
router.get('/', getPH);

router.get('/graph', getPHgraph)

//post
router.post('/:deviceId', addPH);

module.exports = router;