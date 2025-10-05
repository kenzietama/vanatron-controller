const Notification = require("../models/Notification");
const { sendNotification } = require("../lib/socket");

exports.createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const newNotif = new Notification({
      title,
      message,
      timestamp: new Date().toLocaleString(),
    });
    await newNotif.save();
    sendNotification(newNotif);
    res.status(201).json(newNotif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
