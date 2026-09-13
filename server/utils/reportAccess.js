const Subscription = require("../models/Subscription");

const getAccessibleSubscriptionIds = async (user) => {
    if (user.role === "billing_admin") return null;

    const subscriptions = await Subscription.find({
        $or: [
            { owner: user.userId },
            { collaborators: user.userId }
        ]
    }).select("_id");

    return subscriptions.map((subscription) => subscription._id);
};

module.exports = { getAccessibleSubscriptionIds };