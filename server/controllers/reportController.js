const Invoice = require("../models/Invoice");
const CreditNote = require("../models/CreditNote");
const InvoiceStatusHistory = require("../models/InvoiceStatusHistory");
const { getReceivables } = require("../utils/receivables");
const { getAccessibleSubscriptionIds } = require("../utils/reportAccess");
const { isInvoiceOverdue } = require("../utils/invoiceStatus");

const startOfLocalDay = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};

const isoWeekKey = (date) => {
    const weekStart = startOfLocalDay(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);

    const thursday = new Date(weekStart);
    thursday.setDate(thursday.getDate() + 4);

    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);

    return `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const lastEightWeekKeys = (now = new Date()) => {
    const weekCursor = startOfLocalDay(now);
    const day = weekCursor.getDay();
    weekCursor.setDate(weekCursor.getDate() - day);
    weekCursor.setDate(weekCursor.getDate() - 7 * 7);

    const keys = [];

    for (let index = 0; index < 8; index += 1) {
        keys.push(isoWeekKey(weekCursor));
        weekCursor.setDate(weekCursor.getDate() + 7);
    }

    return keys;
};

const toCsvValue = (value) => {
    const text = value === undefined || value === null ? "" : String(value);

    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, "\"\"")}"`;
    }

    return text;
};

const toCsv = (rows, fields) => {
    const header = fields.join(",");
    const body = rows.map((row) => fields.map((field) => toCsvValue(row[field])).join(","));
    return [header, ...body].join("\n");
};

const exportReceivables = async (req, res) => {
    try {
        const accessibleIds = await getAccessibleSubscriptionIds(req.user);
        const filter = { status: "issued" };

        if (accessibleIds) {
            filter.subscription = { $in: accessibleIds };
        }

        const invoices = await Invoice.find(filter)
            .populate("subscription", "customerName billingEmail planName")
            .sort({ dueDate: 1 });

        const rows = invoices.map((invoice) => ({
            subscription: invoice.subscription?.customerName || "",
            billingEmail: invoice.subscription?.billingEmail || "",
            plan: invoice.subscription?.planName || "",
            amount: invoice.amount,
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
            status: invoice.status,
            overdue: isInvoiceOverdue(invoice)
        }));

        const csv = toCsv(rows, [
            "subscription",
            "billingEmail",
            "plan",
            "amount",
            "dueDate",
            "status",
            "overdue"
        ]);

        res.setHeader("Content-Type", "text/csv");
        res.attachment("receivables.csv");
        res.send(csv);
    } catch (error) {
        console.error("Export receivables error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const sumHistoryAmounts = async (match, accessibleIds) => {
    const history = await InvoiceStatusHistory.find(match).select("invoice");
    const invoiceIds = history.map((item) => item.invoice);
    const invoiceFilter = { _id: { $in: invoiceIds } };

    if (accessibleIds) {
        invoiceFilter.subscription = { $in: accessibleIds };
    }

    const invoices = await Invoice.find(invoiceFilter).select("amount");
    return invoices.reduce((total, invoice) => total + invoice.amount, 0);
};

const getDashboardData = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
        const accessibleIds = await getAccessibleSubscriptionIds(req.user);
        const baseMatch = accessibleIds ? { subscription: { $in: accessibleIds } } : {};

        const [issuedThisMonth, collectedThisMonth, receivables, statusBreakdown, planBreakdown, paidHistory] = await Promise.all([
            sumHistoryAmounts({
                newStatus: "issued",
                createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
            }, accessibleIds),
            sumHistoryAmounts({
                newStatus: "paid",
                createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
            }, accessibleIds),
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
            InvoiceStatusHistory.find({
                newStatus: "paid",
                createdAt: { $gte: eightWeeksAgo, $lte: now }
            }).select("invoice createdAt")
        ]);

        const paidInvoiceIds = paidHistory.map((item) => item.invoice);
        const paidInvoiceFilter = { _id: { $in: paidInvoiceIds } };

        if (accessibleIds) {
            paidInvoiceFilter.subscription = { $in: accessibleIds };
        }

        const paidInvoices = await Invoice.find(paidInvoiceFilter).select("amount");
        const amountByInvoice = new Map(
            paidInvoices.map((invoice) => [invoice._id.toString(), invoice.amount])
        );

        const revenueByWeek = new Map();

        for (const item of paidHistory) {
            if (!amountByInvoice.has(item.invoice.toString())) {
                continue;
            }

            const key = isoWeekKey(item.createdAt);
            revenueByWeek.set(
                key,
                (revenueByWeek.get(key) || 0) + amountByInvoice.get(item.invoice.toString())
            );
        }

        const completeRevenueData = lastEightWeekKeys(now).map((key) => ({
            _id: key,
            revenue: revenueByWeek.get(key) || 0
        }));

        const totalReceivables = receivables.reduce(
            (total, item) => total + item.outstandingAmount,
            0
        );
        const overdueReceivables = receivables
            .filter((item) => item.overdue)
            .reduce((total, item) => total + item.outstandingAmount, 0);

        res.json({
            issuedThisMonth,
            collectedThisMonth,
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

module.exports = { exportReceivables, getDashboardData };
