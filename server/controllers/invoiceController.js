const Invoice = require("../models/Invoice");
const Subscription = require("../models/Subscription");
const InvoiceStatusHistory = require("../models/InvoiceStatusHistory");
const InvoiceNote = require("../models/InvoiceNote");
const CreditNote = require("../models/CreditNote");

const { getAccessibleInvoice } = require("../utils/invoiceAccess");
const { isInvoiceOverdue } = require("../utils/invoiceStatus");

const allowedTransitions = {
    draft: ["issued", "void"],
    issued: ["paid", "void"],
    paid: [],
    void: []
};

const createInvoice = async(req, res) => {
    try {
        const {
            subscription,
            periodStart,
            periodEnd,
            amount,
            dueDate
        } = req.body;

        if (!subscription || !periodStart || !periodEnd || !amount === undefined || !dueDate) {
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
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (subscriptionDoc.status !== "active") {
            return res.status(400).json({
                message: "Cannot create an invoice for an archived subscription"
            });
        }

        if (typeof amount !== "number" || amount < 0) {
            return res.status(400).json({
                message: "Amount must be a non-negative number"
            });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        const due = new Date(dueDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(due.getTime())) {
            return res.status(400).json({
                message: "Invalid date provided"
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message: "Period end must be after period start"
            });
        }

        const invoice = await Invoice.create({
            subscription,
            periodStart: start,
            periodEnd: end,
            amount,
            dueDate: due,
            status: "draft"
        });

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });
    } 
    catch (error) {
        console.error("Create invoice error: ", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getInvoices = async (req, res) => {
    try {
        const {
            status,
            subscription,
            overdue,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (status) {
            if (!["draft", "issued", "paid", "void"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid invoice status"
                });
            }

            filter.status = status;
        }

        if (subscription) {
            filter.subscription = subscription;
        }

        if (overdue === "true") {
            filter.status = "issued";
            filter.dueDate = {
                $lt: new Date()
            };
        }

        if (overdue === "false") {
            filter.$or = [
                { status: { $ne: "issued" } },
                { dueDate: { $gte: new Date() } }
            ];
        }

        const allowedSortFields = [
            "amount",
            "dueDate",
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

        /*
         * Account Managers can only see invoices belonging
         * to subscriptions they own or collaborate on.
         */
        if (req.user.role === "account_manager") {
            const accessibleSubscriptions = await Subscription.find({
                $or: [
                    { owner: req.user.userId },
                    { collaborators: req.user.userId }
                ]
            }).select("_id");

            const subscriptionIds = accessibleSubscriptions.map(
                (item) => item._id
            );

            filter.subscription = subscription
                ? subscriptionIds.some(
                    (id) => id.toString() === subscription
                )
                    ? subscription
                    : null
                : { $in: subscriptionIds };
        }

        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1
        };

        const skip = (pageNumber - 1) * pageSize;

        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .populate({
                    path: "subscription",
                    select: "customerName billingEmail planName billingCycle"
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

        res.json({
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

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["draft", "issued", "paid", "void"].includes(status)) {
            return res.status(400).json({
                message: "Invalid invoice status"
            });
        }

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        const subscription = await Subscription.findById(
            invoice.subscription
        );

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const hasAccess =
            req.user.role === "billing_admin" ||
            subscription.owner.toString() === req.user.userId ||
            subscription.collaborators.some(
                (collaboratorId) =>
                    collaboratorId.toString() === req.user.userId
            );

        if (!hasAccess) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        const currentStatus = invoice.status;

        if (!allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                message: `Cannot change invoice status from ${currentStatus} to ${status}`
            });
        }

        invoice.status = status;

        await invoice.save();

        await InvoiceStatusHistory.create({
            invoice: invoice._id,
            oldStatus: currentStatus,
            newStatus: status,
            changedBy: req.user.userId
        });

        res.json({
            message: "Invoice status updated successfully",
            invoice
        });
    } catch (error) {
        console.error("Update invoice status error:", error);

        res.status(500).json({
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
            select: "customerName billingEmail planName billingCycle price startDate"
        });

        res.json({ invoice });
    } 
    catch (error) {
       console.error("Get invoice error:", error);
       
       res.status(500).json({
            message: "Something went wrong"
       });
    }
};

const getInvoiceHistory = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
           return res.status(404).json({
                message: "Invoice not found"
            }); 
        }

        const history = await InvoiceStatusHistory.find({ 
            invoice: invoice._id
        })
            .populate("changedBy", "name email role")
            .sort({ createdAt: 1 });

        res.json({ history });
    } 
    catch (error) {
       console.error("Get invoice history error:", error);
       
       res.status(500).json({
            message: "Something went wrong"
       });
    }
};

const addInvoiceNote = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
           return res.status(404).json({
                message: "Invoice not found"
            }); 
        }

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Note text is required"
            });
        }

        const note = await InvoiceNote.create({
            invoice: invoice._id,
            text: text.trim(),
            createdBy: req.user.userId  
        });

        await note.populate(
            "createdBy",
            "name email role"
        );

        res.status(201).json({
            message: "Invoice note added successfullt=y",
            note
        });
    } 
    catch (error) {
       console.error("Add invoice note error:", error);
       
       res.status(500).json({
            message: "Something went wrong"
       });
    }
};

const getInvoiceNotes = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(
            req.params.id,
            req.user
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        const notes = await InvoiceNote.find({
            invoice: invoice._id
        })
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({
            notes
        });
    } catch (error) {
        console.error("Get invoice notes error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const createCreditNote = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(
            req.params.id,
            req.user
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status !== "paid") {
            return res.status(400).json({
                message: "Credit notes can only be created for paid invoices"
            });
        }

        const { amount, reason } = req.body;

        if (
            amount === undefined ||
            !reason ||
            !reason.trim()
        ) {
            return res.status(400).json({
                message: "Amount and reason are required"
            });
        }

        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({
                message: "Credit note amount must be greater than zero"
            });
        }

        const existingCreditNotes = await CreditNote.find({
            invoice: invoice._id
        });

        const totalCredited = existingCreditNotes.reduce(
            (total, creditNote) => total + creditNote.amount,
            0
        );

        if (totalCredited + amount > invoice.amount) {
            return res.status(400).json({
                message: "Total credit notes cannot exceed invoice amount"
            });
        }

        const creditNote = await CreditNote.create({
            invoice: invoice._id,
            amount,
            reason: reason.trim(),
            createdBy: req.user.userId
        });

        await creditNote.populate(
            "createdBy",
            "name email role"
        );

        res.status(201).json({
            message: "Credit note created successfully",
            creditNote
        });
    } catch (error) {
        console.error("Create credit note error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getCreditNotes = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(
            req.params.id,
            req.user
        );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        const creditNotes = await CreditNote.find({
            invoice: invoice._id
        })
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        const totalCredited = creditNotes.reduce(
            (total, creditNote) => total + creditNote.amount,
            0
        );

        res.json({
            creditNotes,
            totalCredited,
            remainingAmount: invoice.amount - totalCredited
        });
    } catch (error) {
        console.error("Get credit notes error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    createInvoice, getInvoices, updateInvoiceStatus, getInvoice, getInvoiceHistory, addInvoiceNote, getInvoiceNotes, createCreditNote, getCreditNotes
};