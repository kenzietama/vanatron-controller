// routes/notifications.js
const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

// GET all notifications (optionally filter by sensorId)
router.get('/', async (req, res) => {
  try {
    const { sensorId } = req.query;
    const q = sensorId ? { sensorId } : {};
    const list = await Notification.find(q).sort({ timestamp: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// mark as read
router.post('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
