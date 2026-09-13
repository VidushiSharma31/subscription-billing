const { Parser } = require("json2csv");
const Invoice = require("../models/Invoice");
const CreditNote = require("../models/CreditNote");
const { getReceivables } = require("../utils/receivables");
const { getAccessibleSubscriptionIds } = require("../utils/reportAccess");
const { isInvoiceOverdue } = require("../utils/invoiceStatus");

const getReceivablesReport = async (req, res) => {
    try {
        const receivables = await getReceivables(req.user);
        const revenueByWeek = new Map(revenueData.map((item) => [item._id, item.revenue]));
        const completeRevenueData = [];
        const weekCursor = new Date(now);
        weekCursor.setHours(0, 0, 0, 0);
        const day = weekCursor.getDay();
        weekCursor.setDate(weekCursor.getDate() - day);
        weekCursor.setDate(weekCursor.getDate() - 7 * 7);

        for (let index = 0; index < 8; index += 1) {
            const weekStart = new Date(weekCursor);
            const isoWeek = weekStart.toISOString().slice(0, 10);
            const thursday = new Date(weekStart);
            thursday.setDate(thursday.getDate() + 4);
            const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
            const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
            const key = `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
            completeRevenueData.push({ _id: key, revenue: revenueByWeek.get(key) || 0 });
            weekCursor.setDate(weekCursor.getDate() + 7);
        }

        const totalReceivables = receivables.reduce((total, item) => total + item.outstandingAmount, 0);
        const overdueReceivables = receivables.filter((item) => item.overdue)
            .reduce((total, item) => total + item.outstandingAmount, 0);

        res.json({ receivables, summary: { totalReceivables, overdueReceivables } });
    } catch (error) {
        console.error("Get receivables report error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const exportReceivables = async (req, res) => {
    try {
        const accessibleIds = await getAccessibleSubscriptionIds(req.user);
        const filter = { status: "issued" };
        if (accessibleIds) filter.subscription = { $in: accessibleIds };

        const invoices = await Invoice.find(filter)
            .populate("subscription", "customerName billingEmail planName")
            .sort({ dueDate: 1 });

        const creditNotes = await CreditNote.find({ invoice: { $in: invoices.map((invoice) => invoice._id) } });
        const creditedByInvoice = new Map();
        for (const note of creditNotes) {
            creditedByInvoice.set(note.invoice.toString(), (creditedByInvoice.get(note.invoice.toString()) || 0) + note.amount);
        }

        const rows = invoices.map((invoice) => {
            const totalCredited = creditedByInvoice.get(invoice._id.toString()) || 0;
            return {
                subscription: invoice.subscription?.customerName || "",
                plan: invoice.subscription?.planName || "",
                amount: invoice.amount,
                dueDate: invoice.dueDate,
                status: invoice.status,
                overdue: isInvoiceOverdue(invoice),
                outstandingAmount: Math.max(invoice.amount - totalCredited, 0)
            };
        });

        const parser = new Parser({
            fields: ["subscription", "plan", "amount", "dueDate", "status", "overdue", "outstandingAmount"]
        });
        const csv = parser.parse(rows);

        res.setHeader("Content-Type", "text/csv");
        res.attachment("receivables.csv");
        res.send(csv);
    } catch (error) {
        console.error("Export receivables error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const accessibleIds = await getAccessibleSubscriptionIds(req.user);
        const baseMatch = accessibleIds ? { subscription: { $in: accessibleIds } } : {};

        const issuedMatch = {
            ...baseMatch,
            status: "issued",
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
        };
        const paidMatch = {
            ...baseMatch,
            status: "paid",
            updatedAt: { $gte: startOfMonth, $lt: startOfNextMonth }
        };

        const [issuedThisMonth, collectedThisMonth, receivables, statusBreakdown, planBreakdown, revenueData] = await Promise.all([
            Invoice.aggregate([{ $match: issuedMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            Invoice.aggregate([{ $match: paidMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            getReceivables(req.user),
            Invoice.aggregate([
                { $match: baseMatch },
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Invoice.aggregate([
                { $match: baseMatch },
                { $lookup: { from: "subscriptions", localField: "subscription", foreignField: "_id", as: "subscriptionDoc" } },
                { $unwind: "$subscriptionDoc" },
                { $group: { _id: "$subscriptionDoc.planName", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            Invoice.aggregate([
                {
                    $match: {
                        ...baseMatch,
                        status: "paid",
                        updatedAt: { $gte: new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000), $lte: now }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%G-W%V", date: "$updatedAt" } },
                        revenue: { $sum: "$amount" }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const revenueByWeek = new Map(revenueData.map((item) => [item._id, item.revenue]));
        const completeRevenueData = [];
        const weekCursor = new Date(now);
        weekCursor.setHours(0, 0, 0, 0);
        const day = weekCursor.getDay();
        weekCursor.setDate(weekCursor.getDate() - day);
        weekCursor.setDate(weekCursor.getDate() - 7 * 7);

        for (let index = 0; index < 8; index += 1) {
            const weekStart = new Date(weekCursor);
            const isoWeek = weekStart.toISOString().slice(0, 10);
            const thursday = new Date(weekStart);
            thursday.setDate(thursday.getDate() + 4);
            const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
            const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
            const key = `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
            completeRevenueData.push({ _id: key, revenue: revenueByWeek.get(key) || 0 });
            weekCursor.setDate(weekCursor.getDate() + 7);
        }

        const totalReceivables = receivables.reduce((total, item) => total + item.outstandingAmount, 0);
        const overdueReceivables = receivables.filter((item) => item.overdue)
            .reduce((total, item) => total + item.outstandingAmount, 0);

        res.json({
            issuedThisMonth: issuedThisMonth[0]?.total || 0,
            collectedThisMonth: collectedThisMonth[0]?.total || 0,
            receivables: totalReceivables,
            overdueReceivables,
            statusBreakdown,
            planBreakdown,
            revenueData: completeRevenueData
        });
    } catch (error) {
        console.error("Get dashboard data error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { getReceivablesReport, exportReceivables, getDashboardData };
