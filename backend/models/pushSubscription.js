const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    subscription: { type: Object, required: true },
    userAgent: { type: String },
    lastSuccessAt: { type: Date },
    lastFailureAt: { type: Date },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
