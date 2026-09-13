const Invoice = require("../models/Invoice");
const OverdueAlert = require("../models/OverdueAlert");
const { getAccessibleSubscriptionIds } = require("../utils/reportAccess");
const { getAccessibleInvoice } = require("../utils/invoiceAccess");

const syncOverdueAlerts = async (user) => {
    const accessibleIds = await getAccessibleSubscriptionIds(user);
    const filter = { status: "issued", dueDate: { $lt: new Date() } };

    if (accessibleIds) filter.subscription = { $in: accessibleIds };

    const invoices = await Invoice.find(filter).populate(
        "subscription",
        "customerName billingEmail planName"
    );

    const alerts = [];

    for (const invoice of invoices) {
        let alert = await OverdueAlert.findOne({ invoice: invoice._id });

        if (!alert) {
            alert = await OverdueAlert.create({
                invoice: invoice._id,
                dueDateSnapshot: invoice.dueDate
            });
        } else if (
            new Date(alert.dueDateSnapshot).getTime() !==
            new Date(invoice.dueDate).getTime()
        ) {
            alert.dueDateSnapshot = invoice.dueDate;
            alert.dismissedAt = null;
            alert.dismissedBy = null;
            await alert.save();
        }

        if (!alert.dismissedAt) alerts.push({ invoice, alert });
    }

    return alerts;
};

const getOverdueAlerts = async (req, res) => {
    try {
        const alerts = await syncOverdueAlerts(req.user);

        return res.json({
            alerts: alerts.map(({ invoice, alert }) => ({
                _id: alert._id,
                invoice: {
                    _id: invoice._id,
                    customerName: invoice.subscription?.customerName,
                    billingEmail: invoice.subscription?.billingEmail,
                    planName: invoice.subscription?.planName,
                    amount: invoice.amount,
                    dueDate: invoice.dueDate
                }
            })),
            count: alerts.length
        });
    } catch (error) {
        console.error("Get overdue alerts error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const getOverdueAlertCount = async (req, res) => {
    try {
        const alerts = await syncOverdueAlerts(req.user);
        return res.json({ count: alerts.length });
    } catch (error) {
        console.error("Get overdue alert count error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const dismissOverdueAlert = async (req, res) => {
    try {
        const alert = await OverdueAlert.findById(req.params.id).populate({
            path: "invoice",
            populate: { path: "subscription", select: "owner collaborators" }
        });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        const invoice = await getAccessibleInvoice(alert.invoice._id, req.user);

        if (!invoice) {
            return res.status(403).json({
                message: "You do not have permission to dismiss this alert"
            });
        }

        alert.dismissedAt = new Date();
        alert.dismissedBy = req.user.userId;
        await alert.save();

        return res.json({ message: "Alert dismissed successfully" });
    } catch (error) {
        console.error("Dismiss overdue alert error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    getOverdueAlerts,
    getOverdueAlertCount,
    dismissOverdueAlert
};
