const SubscriptionAudit = require("../models/SubscriptionAudit");
const { getAccessibleSubscription } = require("../utils/subscriptionAccess");

const getSubscriptionAudit = async (req, res) => {
    try {
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const events = await SubscriptionAudit.find({
            subscription: subscription._id
        })
            .populate("performedBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({ events });
    } catch (error) {
        console.error("Get subscription audit error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    getSubscriptionAudit
};