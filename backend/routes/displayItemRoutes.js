const express = require('express');
const {
    getDisplayItems,
    addDisplayItem,
    deleteDisplayItem,
    getDisplayItem,
    updateDisplayItem,
    getData,
    getGraph,
    getLatestData
} = require('../controllers/displayItemController');

const router = express.Router();

router.get('/monitoring', getData)

router.get('/monitoring/graph/interval=:interval/', getGraph)

router.get('/monitoring/latest', getLatestData)

router.get('/', getDisplayItems);

router.get('/:id', getDisplayItem);

router.post('/', addDisplayItem);

router.put('/:id', updateDisplayItem)

router.delete('/:id', deleteDisplayItem);

module.exports = router;