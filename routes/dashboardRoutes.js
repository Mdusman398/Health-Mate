const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getDashboard } = require("../controller/dashboardController");

router.get("/", auth, getDashboard);

module.exports = router;