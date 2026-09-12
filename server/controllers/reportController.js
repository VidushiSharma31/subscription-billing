const { getReceivables } = require("../utils/receivables");
const { Parser } = require("json2csv");
const Invoice = require("../models/Invoice")

const getReceivablesReport = async (req, res) => {
    try {
        const receivables = await getReceivables();

        const totalReceivables = receivables.reduce(
            (total, item) => total + item.outstandingAmount,
            0
        );

        const overdueReceivables = receivables
            .filter((item) => item.overdue)
            .reduce(
                (total, item) => total + item.outstandingAmount,
                0
            );

        res.json({
            receivables,
            summary: {
                totalReceivables,
                overdueReceivables
            }
        });
    } catch (error) {
        console.error(
            "Get receivables report error:",
            error
        );

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const exportReceivables = async (req, res) => {
    try {
        const receivables = await getReceivables();

        const rows = receivables.map((item) => ({
            customerName: item.invoice.subscription.customerName,
            billingEmail: item.invoice.subscription.billingEmail,
            planName: item.invoice.subscription.planName,
            invoiceId: item.invoice._id.toString(),
            periodStart: item.invoice.periodStart,
            periodEnd: item.invoice.periodEnd,
            dueDate: item.invoice.dueDate,
            invoiceAmount: item.invoice.amount,
            totalCredited: item.totalCredited,
            outstandingAmount: item.outstandingAmount,
            overdue: item.overdue
        }));

        const fields = [
            "customerName",
            "billingEmail",
            "planName",
            "invoiceId",
            "periodStart",
            "periodEnd",
            "dueDate",
            "invoiceAmount",
            "totalCredited",
            "outstandingAmount",
            "overdue"
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(rows);

        res.header("Content-Type", "text/csv");
        res.attachment("receivables.csv");

        res.send(csv);
    } catch (error) {
        console.error(
            "Export receivables error:",
            error
        );

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const now = new Date();

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const startOfNextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        // Issued invoices created this month
        const issuedThisMonth = await Invoice.aggregate([
            {
                $match: {
                    status: "issued",
                    createdAt: {
                        $gte: startOfMonth,
                        $lt: startOfNextMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Paid invoices created this month
        const collectedThisMonth = await Invoice.aggregate([
            {
                $match: {
                    status: "paid",
                    updatedAt: {
                        $gte: startOfMonth,
                        $lt: startOfNextMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const receivables = await getReceivables();

        const totalReceivables = receivables.reduce(
            (total, item) => total + item.outstandingAmount,
            0
        );

        const overdueReceivables = receivables
            .filter((item) => item.overdue)
            .reduce(
                (total, item) => total + item.outstandingAmount,
                0
            );

        // Invoice status breakdown
        const statusBreakdown = await Invoice.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Plan breakdown
        const planBreakdown = await Invoice.aggregate([
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "subscription",
                    foreignField: "_id",
                    as: "subscription"
                }
            },
            {
                $unwind: "$subscription"
            },
            {
                $group: {
                    _id: "$subscription.planName",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue for the last 8 weeks
        const eightWeeksAgo = new Date(now);
        eightWeeksAgo.setDate(
            eightWeeksAgo.getDate() - 56
        );

        const revenueData = await Invoice.aggregate([
            {
                $match: {
                    status: "paid",
                    updatedAt: {
                        $gte: eightWeeksAgo,
                        $lte: now
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%G-W%V",
                            date: "$updatedAt"
                        }
                    },
                    revenue: {
                        $sum: "$amount"
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ]);

        res.json({
            issuedThisMonth:
                issuedThisMonth[0]?.total || 0,

            collectedThisMonth:
                collectedThisMonth[0]?.total || 0,

            receivables: totalReceivables,

            overdueReceivables,

            statusBreakdown,

            planBreakdown,

            revenueData
        });
    } catch (error) {
        console.error(
            "Get dashboard data error:",
            error
        );

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    getReceivablesReport,
    exportReceivables,
    getDashboardData
};