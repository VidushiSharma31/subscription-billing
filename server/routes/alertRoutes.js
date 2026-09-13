const express = require("express");
const {
    getOverdueAlerts,
    getOverdueAlertCount,
    dismissOverdueAlert
} = require("../controllers/overdueAlertController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/overdue", authenticateUser, getOverdueAlerts);
router.get("/overdue/count", authenticateUser, getOverdueAlertCount);
router.patch(
    "/overdue/:id/dismiss",
    authenticateUser,
    authorizeRoles("billing_admin"),
    dismissOverdueAlert
);

module.exports = router;
