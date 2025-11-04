const PushSubscription = require("../models/pushSubscription");

const ensureJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

exports.getPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({
      error: "VAPID_PUBLIC_KEY is not configured on the server.",
    });
  }
  res.json({ publicKey });
};

exports.subscribe = async (req, res) => {
  const payload = ensureJson(req.body.subscription ?? req.body);
  if (!payload?.endpoint || !payload?.keys) {
    return res.status(400).json({ error: "Invalid push subscription payload." });
  }

  try {
    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: payload.endpoint },
      {
        subscription: payload,
        userAgent: req.body.userAgent ?? req.headers["user-agent"],
        lastFailureAt: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ id: doc.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  const endpoint = req.body?.endpoint || req.query?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ error: "Missing subscription endpoint." });
  }

  try {
    await PushSubscription.deleteOne({ endpoint });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
