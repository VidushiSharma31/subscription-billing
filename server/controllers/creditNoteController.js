const CreditNote = require("../models/CreditNote");
const { getAccessibleInvoice } = require("../utils/invoiceAccess");

const createCreditNote = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.status !== "paid") {
            return res.status(400).json({
                message: "Credit notes can only be created for paid invoices"
            });
        }

        const { amount, reason } = req.body;

        if (amount === undefined || !reason || !reason.trim()) {
            return res.status(400).json({
                message: "Amount and reason are required"
            });
        }

        if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
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

        await creditNote.populate("createdBy", "name email role");

        return res.status(201).json({
            message: "Credit note created successfully",
            creditNote
        });
    } catch (error) {
        console.error("Create credit note error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const getCreditNotes = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
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

        return res.json({
            creditNotes,
            totalCredited,
            remainingAmount: invoice.amount - totalCredited
        });
    } catch (error) {
        console.error("Get credit notes error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    createCreditNote,
    getCreditNotes
};
