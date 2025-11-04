const Notification = require("../models/notification");
const DisplayItem = require("../models/displayItem");
const { sendNotification } = require("./socket");

async function emitThresholdAlerts(sensor, deviceId, payload) {
  const items = await DisplayItem.find({ sensor, device: deviceId });
  if (!items.length) return;

  for (const item of items) {
    const value = Number(payload[item.parameter]);
    if (!Number.isFinite(value)) continue;

    const { minValue, maxValue } = item;
    let severity = null;
    if (value < minValue) severity = "LOW";
    if (value > maxValue) severity = "HIGH";
    if (!severity) continue;

    const title = `Alert: ${item.displayName}`;
    const message =
      severity === "LOW"
        ? `${item.displayName} dropped below ${minValue} ${item.unit}`
        : `${item.displayName} exceeded ${maxValue} ${item.unit}`;

    const notif = await Notification.create({
      title,
      message,
      sensor,
      device: deviceId,
      parameter: item.parameter,
      value,
      minValue,
      maxValue,
      severity,
      timestamp: new Date().toISOString(),
    });

    sendNotification(notif);
  }
}

module.exports = { emitThresholdAlerts };