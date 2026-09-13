const mongoose = require("mongoose");
const Subscription = require("../models/Subscription");

const toIdString = (id) => id.toString();

const intersectIds = (currentIds, nextIds) => {
    const next = new Set(nextIds.map(toIdString));

    if (currentIds === null) {
        return [...next];
    }

    return currentIds.filter((id) => next.has(id));
};

const resolveInvoiceSubscriptionIds = async ({
    user,
    search,
    subscription,
    owner
}) => {
    let ids = null;

    if (user.role === "account_manager") {
        const accessible = await Subscription.find({
            $or: [
                { owner: user.userId },
                { collaborators: user.userId }
            ]
        }).select("_id");

        ids = accessible.map((item) => item._id.toString());
    }

    if (search && search.trim()) {
        const searchRegex = {
            $regex: search.trim(),
            $options: "i"
        };

        const matching = await Subscription.find({
            $or: [
                { customerName: searchRegex },
                { billingEmail: searchRegex }
            ]
        }).select("_id");

        ids = intersectIds(ids, matching.map((item) => item._id));
    }

    if (owner) {
        if (!mongoose.Types.ObjectId.isValid(owner)) {
            return [];
        }

        const owned = await Subscription.find({ owner }).select("_id");
        ids = intersectIds(ids, owned.map((item) => item._id));
    }

    if (subscription) {
        if (!mongoose.Types.ObjectId.isValid(subscription)) {
            return [];
        }

        ids = intersectIds(ids, [subscription]);
    }

    return ids;
};

module.exports = {
    resolveInvoiceSubscriptionIds
};
