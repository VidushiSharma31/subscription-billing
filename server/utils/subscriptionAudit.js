const SubscriptionAudit = require("../models/SubscriptionAudit");

const createSubscriptionAudit = async ({
    subscriptionId,
    action,
    performedBy,
    details = ""
}) => {
    return SubscriptionAudit.create({
        subscription: subscriptionId,
        action,
        performedBy,
        details
    });
};

module.exports = {
    createSubscriptionAudit
};