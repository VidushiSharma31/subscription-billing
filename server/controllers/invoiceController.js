const Invoice = require("../models/Invoice");
const Subscription = require("../models/Subscription");

const { getAccessibleInvoice } = require("../utils/invoiceAccess");
const { isInvoiceOverdue } = require("../utils/invoiceStatus");
const { resolveInvoiceSubscriptionIds } = require("../utils/invoiceQuery");
const { isValidMoney, toMoney } = require("../utils/money");

const parseInvoiceDates = (periodStart, periodEnd, dueDate) => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const due = new Date(dueDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        Number.isNaN(due.getTime())
    ) {
        return { error: "Invalid date provided" };
    }

    if (start >= end) {
        return { error: "Period end must be after period start" };
    }

    return { start, end, due };
};

const createInvoice = async (req, res) => {
    try {
        const {
            subscription,
            periodStart,
            periodEnd,
            amount,
            dueDate
        } = req.body;

        if (
            !subscription ||
            !periodStart ||
            !periodEnd ||
            amount === undefined ||
            !dueDate
        ) {
            return res.status(400).json({
                message: "All invoice fields are required"
            });
        }

        const subscriptionDoc = await Subscription.findById(subscription);

        if (!subscriptionDoc) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const hasAccess =
            req.user.role === "billing_admin" ||
            subscriptionDoc.owner.toString() === req.user.userId ||
            subscriptionDoc.collaborators.some(
                (collaboratorId) =>
                    collaboratorId.toString() === req.user.userId
            );

        if (!hasAccess) {
            return res.status(403).json({
                message: "You do not have access to this subscription"
            });
        }

        if (subscriptionDoc.status !== "active") {
            return res.status(400).json({
                message: "Cannot create an invoice for an archived subscription"
            });
        }

        if (!isValidMoney(amount)) {
            return res.status(400).json({
                message: "Amount must be a non-negative number with up to two decimal places"
            });
        }

        const dates = parseInvoiceDates(periodStart, periodEnd, dueDate);

        if (dates.error) {
            return res.status(400).json({ message: dates.error });
        }

        const invoice = await Invoice.create({
            subscription,
            createdBy: req.user.userId,
            periodStart: dates.start,
            periodEnd: dates.end,
            amount: toMoney(amount),
            dueDate: dates.due,
            status: "draft"
        });

        return res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });
    } catch (error) {
        console.error("Create invoice error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const emptyInvoicePage = (page, limit) => ({
    invoices: [],
    pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        total: 0,
        totalPages: 0
    }
});

const getInvoices = async (req, res) => {
    try {
        const {
            search,
            status,
            subscription,
            owner,
            overdue,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const subscriptionIds = await resolveInvoiceSubscriptionIds({
            user: req.user,
            search,
            subscription,
            owner
        });

        if (Array.isArray(subscriptionIds) && subscriptionIds.length === 0) {
            return res.json(emptyInvoicePage(page, limit));
        }

        const filter = {};

        if (subscriptionIds) {
            filter.subscription = { $in: subscriptionIds };
        }

        if (status) {
            if (!["draft", "issued", "paid", "void"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid invoice status"
                });
            }

            filter.status = status;
        }

        if (overdue === "true") {
            if (status && status !== "issued") {
                return res.json(emptyInvoicePage(page, limit));
            }

            filter.status = "issued";
            filter.dueDate = { $lt: new Date() };
        }

        if (overdue === "false") {
            if (status === "issued") {
                filter.dueDate = { $gte: new Date() };
            } else if (!status) {
                filter.$or = [
                    { status: { $ne: "issued" } },
                    { dueDate: { $gte: new Date() } }
                ];
            }
        }

        const allowedSortFields = [
            "amount",
            "dueDate",
            "status",
            "periodStart",
            "periodEnd",
            "createdAt"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                message: "Invalid sort field"
            });
        }

        if (!["asc", "desc"].includes(sortOrder)) {
            return res.status(400).json({
                message: "Invalid sort order"
            });
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                message: "Invalid pagination parameters"
            });
        }

        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1
        };

        const skip = (pageNumber - 1) * pageSize;

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate({
                    path: "subscription",
                    select: "customerName billingEmail planName billingCycle owner"
                })
                .sort(sort)
                .skip(skip)
                .limit(pageSize),
            Invoice.countDocuments(filter)
        ]);

        const invoicesWithOverdue = invoices.map((invoice) => ({
            ...invoice.toObject(),
            overdue: isInvoiceOverdue(invoice)
        }));

        return res.json({
            invoices: invoicesWithOverdue,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error("Get invoices error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getInvoice = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        await invoice.populate({
            path: "subscription",
            select: "customerName billingEmail planName billingCycle price startDate owner collaborators"
        });

        return res.json({
            invoice: {
                ...invoice.toObject(),
                overdue: isInvoiceOverdue(invoice)
            }
        });
    } catch (error) {
        console.error("Get invoice error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const updateInvoiceDraft = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status !== "draft") {
            return res.status(400).json({
                message: "Only draft invoices can be edited this way"
            });
        }

        const { periodStart, periodEnd, amount, dueDate } = req.body;

        if (!periodStart || !periodEnd || amount === undefined || !dueDate) {
            return res.status(400).json({
                message: "All invoice fields are required"
            });
        }

        if (!isValidMoney(amount)) {
            return res.status(400).json({
                message: "Amount must be a non-negative number with up to two decimal places"
            });
        }

        const dates = parseInvoiceDates(periodStart, periodEnd, dueDate);

        if (dates.error) {
            return res.status(400).json({ message: dates.error });
        }

        invoice.periodStart = dates.start;
        invoice.periodEnd = dates.end;
        invoice.amount = toMoney(amount);
        invoice.dueDate = dates.due;

        await invoice.save();

        return res.json({
            message: "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        console.error("Update invoice draft error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const updateInvoiceDueDate = async (req, res) => {
    try {
        const { dueDate } = req.body;

        if (!dueDate) {
            return res.status(400).json({
                message: "Due date is required"
            });
        }

        const parsedDueDate = new Date(dueDate);

        if (Number.isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({
                message: "Invalid due date"
            });
        }

        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status === "paid") {
            return res.status(400).json({
                message: "Paid invoices cannot be modified"
            });
        }

        if (invoice.status === "void") {
            return res.status(400).json({
                message: "Void invoices cannot be modified"
            });
        }

        invoice.dueDate = parsedDueDate;
        await invoice.save();

        return res.json({
            message: "Invoice due date updated successfully",
            invoice
        });
    } catch (error) {
        console.error("Update invoice due date error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoiceDraft,
    updateInvoiceDueDate
};
