// const Notification = require("../models/notification");
// const { sendNotification } = require("../lib/socket");

// exports.createNotification = async (req, res) => {
//   try {
//     const { title, message } = req.body;
//     const newNotif = new Notification({
//       title,
//       message,
//       timestamp: new Date().toLocaleString(),
//     });
//     await newNotif.save();
//     sendNotification(newNotif);
//     res.status(201).json(newNotif);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.getNotifications = async (req, res) => {
//   try {
//     const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
//     res.json(notifs);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/notificationController.js


const Notification = require("../models/notification");
const { sendNotification } = require("../lib/socket");

// CREATE notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message, sensorId } = req.body;

    const newNotif = new Notification({
      title,
      message,
      sensorId,
      timestamp: new Date().toLocaleString(),
      read: false,
    });

    await newNotif.save();

    // kirim realtime via socket
    sendNotification(newNotif);

    res.status(201).json(newNotif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OPTIONAL: kalau suatu saat mau pakai via controller
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// OPTIONAL: kalau mau dipakai via route/controller
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

