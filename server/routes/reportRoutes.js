const express = require("express");

const {
    exportReceivables,
    getDashboardData
} = require("../controllers/reportController");

const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/receivables/export",
    authenticateUser,
    exportReceivables
);

router.get(
    "/dashboard",
    authenticateUser,
    getDashboardData
);

module.exports = router;