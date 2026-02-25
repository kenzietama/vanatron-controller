const express = require('express');
const {
  addSensor,
  getSensor,
  getSensors,
  deleteSensor,
  editSensor,
    updateSensors,
    getDevices
} = require('../controllers/sensorController');

const router = express.Router();

router.get('/', getSensors);
router.get('/update', updateSensors);
router.post('/add', addSensor);
router.get('/:name/devices', getDevices)
router.get('/:id', getSensor);
router.put('/:id', editSensor);
router.delete('/:id', deleteSensor);

module.exports = router;
