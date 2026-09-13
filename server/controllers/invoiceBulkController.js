const Invoice = require("../models/Invoice");
const Subscription = require("../models/Subscription");
const { toMoney } = require("../utils/money");

const getCurrentPeriod = (billingCycle, today = new Date()) => {
    if (billingCycle === "monthly") {
        return {
            periodStart: new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)),
            periodEnd: new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0))
        };
    }

    return {
        periodStart: new Date(Date.UTC(today.getFullYear(), 0, 1)),
        periodEnd: new Date(Date.UTC(today.getFullYear(), 11, 31))
    };
};

const generateCurrentPeriodInvoices = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({
            status: "active"
        });

        const results = [];
        const today = new Date();

        for (const subscription of subscriptions) {
            try {
                const { periodStart, periodEnd } = getCurrentPeriod(
                    subscription.billingCycle,
                    today
                );

                const existingInvoice = await Invoice.findOne({
                    subscription: subscription._id,
                    periodStart,
                    periodEnd
                });

                if (existingInvoice) {
                    results.push({
                        subscription: subscription._id,
                        customerName: subscription.customerName,
                        planName: subscription.planName,
                        status: "skipped",
                        reason: "Invoice already exists for this period"
                    });
                    continue;
                }

                const dueDate = new Date(periodEnd);
                dueDate.setUTCDate(dueDate.getUTCDate() + 30);

                const invoice = await Invoice.create({
                    subscription: subscription._id,
                    createdBy: req.user.userId,
                    periodStart,
                    periodEnd,
                    amount: toMoney(subscription.price),
                    dueDate,
                    status: "draft"
                });

                results.push({
                    subscription: subscription._id,
                    customerName: subscription.customerName,
                    planName: subscription.planName,
                    invoice: invoice._id,
                    status: "generated"
                });
            } catch (error) {
                console.error(
                    `Invoice generation failed for subscription ${subscription._id}:`,
                    error.message
                );

                results.push({
                    subscription: subscription._id,
                    customerName: subscription.customerName,
                    planName: subscription.planName,
                    status: "failed",
                    reason: error.message
                });
            }
        }

        return res.status(200).json({
            message: "Bulk invoice generation completed",
            results
        });
    } catch (error) {
        console.error("Bulk invoice generation error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    generateCurrentPeriodInvoices
};
