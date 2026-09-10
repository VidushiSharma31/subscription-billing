const Subscription = require("../models/Subscription");

const getAccessibleSubscription = async (subscriptionId, user) => {
    let filter = {
        _id: subscriptionId
    };

    if (user.role === "account_manager") {
        filter.$or = [
            { owner: user.userId },
            { collaborators: user.userId }
        ];
    }

    return Subscription.findOne(filter);
};

module.exports = {
    getAccessibleSubscription
};