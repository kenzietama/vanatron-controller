const express = require("express");
const controller = require("../controllers/pushSubscriptionController");

const router = express.Router();

router.get("/public-key", controller.getPublicKey);
router.post("/", controller.subscribe);
router.delete("/", controller.unsubscribe);

module.exports = router;
