const express = require("express");
const {
    getControl,
    getControlHistory,
    setControl,
} = require("../controllers/controlSystemController");
const {protectRoute} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", getControl);
router.get("/history", protectRoute, getControlHistory);
router.post("/", protectRoute, setControl);

module.exports = router;