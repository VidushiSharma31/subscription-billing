const express = require("express");

const {
    createSubscription,
    getSubscriptions,
    getSubscription,
    updateSubscription,
    archiveSubscription,
    restoreSubscription,
    updateCollaborators
} = require("../controllers/subscriptionController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { getSubscriptionAudit } = require("../controllers/subscriptionAuditController");

const router = express.Router();

router.post(
    "/",
    authenticateUser,
    createSubscription
);

router.get(
    "/",
    authenticateUser,
    getSubscriptions
);

router.get(
    "/:id",
    authenticateUser,
    getSubscription
);

router.get(
    "/:id/audit",
    authenticateUser,
    getSubscriptionAudit
);

router.put(
    "/:id",
    authenticateUser,
    updateSubscription
);

router.patch(
    "/:id/archive",
    authenticateUser,
    authorizeRoles("billing_admin"),
    archiveSubscription
);

router.patch(
    "/:id/restore",
    authenticateUser,
    authorizeRoles("billing_admin"),
    restoreSubscription
);

router.patch(
    "/:id/collaborators",
    authenticateUser,
    authorizeRoles("billing_admin"),
    updateCollaborators
);

module.exports = router;