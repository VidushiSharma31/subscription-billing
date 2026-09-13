const InvoiceStatusHistory = require("../models/InvoiceStatusHistory");
const InvoiceNote = require("../models/InvoiceNote");
const CreditNote = require("../models/CreditNote");
const { getAccessibleInvoice } = require("../utils/invoiceAccess");

const getInvoiceTimeline = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        await invoice.populate({ path: "createdBy", select: "name email role" });

        const [history, notes, creditNotes] = await Promise.all([
            InvoiceStatusHistory.find({ invoice: invoice._id })
                .populate("changedBy", "name email role")
                .sort({ createdAt: 1 }),
            InvoiceNote.find({ invoice: invoice._id })
                .populate("createdBy", "name email role")
                .sort({ createdAt: 1 }),
            CreditNote.find({ invoice: invoice._id })
                .populate("createdBy", "name email role")
                .sort({ createdAt: 1 })
        ]);

        const timeline = [
            {
                id: `created-${invoice._id}`,
                type: "created",
                createdAt: invoice.createdAt,
                user: invoice.createdBy || null,
                details: { status: "draft" }
            },
            ...history.map((item) => ({
                id: item._id,
                type: "status_change",
                createdAt: item.createdAt,
                user: item.changedBy,
                details: {
                    oldStatus: item.oldStatus,
                    newStatus: item.newStatus,
                    reason: item.reason || null
                }
            })),
            ...notes.map((item) => ({
                id: item._id,
                type: "note",
                createdAt: item.createdAt,
                user: item.createdBy,
                details: { text: item.text }
            })),
            ...creditNotes.map((item) => ({
                id: item._id,
                type: "credit_note",
                createdAt: item.createdAt,
                user: item.createdBy,
                details: {
                    amount: item.amount,
                    reason: item.reason
                }
            }))
        ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return res.json({ timeline });
    } catch (error) {
        console.error("Get invoice timeline error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { getInvoiceTimeline };
