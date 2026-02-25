// // routes/notifications.js
// const express = require('express');
// const Notification = require('../models/notification');

// const router = express.Router();

// // GET all notifications (optionally filter by sensorId)
// router.get('/', async (req, res) => {
//   try {
//     const { sensorId } = req.query;
//     const q = sensorId ? { sensorId } : {};
//     const list = await Notification.find(q).sort({ timestamp: -1 }).limit(100);
//     res.json(list);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // mark as read
// router.post('/:id/read', async (req, res) => {
//   try {
//     await Notification.findByIdAndUpdate(req.params.id, { read: true });
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

// routes/notifications.js
const express = require("express");
const Notification = require("../models/notification");

const router = express.Router();

// GET all notifications (optional filter by sensorId)
router.get("/", async (req, res) => {
  try {
    const { sensorId } = req.query;
    const query = sensorId ? { sensorId } : {};

    const list = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK notification as read
router.post("/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
