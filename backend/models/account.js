const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true }, // 'active' or 'non-active'
  photo: { type: String, default: null }, // Base64 string
});

module.exports = mongoose.model("Account", accountSchema);