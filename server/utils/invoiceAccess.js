const { get } = require("mongoose");
const Invoice = require("../models/Invoice");
const Subscription = require("../models/Subscription");

const getAccessibleInvoice = async (invoiceId, user) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        return null;
    }

    const subscription = await Subscription.findById(invoice.subscription);

    if (!subscription) {
        return null;
    }

    const hasAccess =
        user.role === "billing_admin" ||
        subscription.owner.toString() === user.userId ||
        subscription.collaborators.some(
            (collaboratorId) =>
                collaboratorId.toString() === user.userId
        );

    if (!hasAccess) {
        return null;
    }

    return invoice;
};

module.exports = {
    getAccessibleInvoice
};