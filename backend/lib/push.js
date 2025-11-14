const webpush = require("web-push");
const PushSubscription = require("../models/pushSubscription");
const dotenv = require("dotenv");

dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:no-reply@example.com";

let vapidConfigured = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
} else {
  console.warn(
    "Push notifications are disabled: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set."
  );
}

const serializeNotification = (notification) => {
  const fallbackTitle = notification?.title || "New Alert";
  const fallbackBody = notification?.message || "You have a new notification.";
  const payload = {
    title: fallbackTitle,
    body: fallbackBody,
    url: notification?.url || "/notifications",
    timestamp: notification?.timestamp || new Date().toISOString(),
    data: {
      sensor: notification?.sensor,
      device: notification?.device,
      parameter: notification?.parameter,
      severity: notification?.severity,
      value: notification?.value,
      minValue: notification?.minValue,
      maxValue: notification?.maxValue,
    },
  };
  return JSON.stringify(payload);
};

exports.sendPushNotification = async (notification) => {
  if (!vapidConfigured) {
    return;
  }

  const subscriptions = await PushSubscription.find({});
  if (!subscriptions.length) {
    return;
  }

  const payload = serializeNotification(notification);

  await Promise.allSettled(
    subscriptions.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.subscription, payload);
        doc.lastSuccessAt = new Date();
        doc.lastFailureAt = null;
        await doc.save();
      } catch (error) {
        doc.lastFailureAt = new Date();
        await doc.save().catch(() => {});

        const isGone = error.statusCode === 404 || error.statusCode === 410;
        if (isGone) {
          await PushSubscription.deleteOne({ _id: doc._id });
        } else {
          console.error("Failed to send push notification", error.message);
        }
      }
    })
  );
};
