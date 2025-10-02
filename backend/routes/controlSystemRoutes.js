const express = require("express");
const {
    getControl,
    setControl,
} = require("../controllers/controlSystemController");
const {protectRoute} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", getControl);

router.post("/", protectRoute, setControl);

module.exports = router;