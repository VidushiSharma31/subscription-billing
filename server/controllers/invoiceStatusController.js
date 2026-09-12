const Invoice = require("../models/Invoice");
const InvoiceStatusHistory = require("../models/InvoiceStatusHistory");
const { getAccessibleInvoice } = require("../utils/invoiceAccess");

const allowedTransitions = {
    draft: ["issued", "void"],
    issued: ["paid", "void"],
    paid: [],
    void: []
};

const updateInvoiceStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!["draft", "issued", "paid", "void"].includes(status)) {
            return res.status(400).json({ message: "Invalid invoice status" });
        }

        if (status === "void" && (!reason || !reason.trim())) {
            return res.status(400).json({
                message: "A reason is required to void an invoice"
            });
        }

        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const currentStatus = invoice.status;

        if (!allowedTransitions[currentStatus]?.includes(status)) {
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
            changedBy: req.user.userId,
            reason: status === "void" ? reason.trim() : undefined
        });

        return res.json({
            message: "Invoice status updated successfully",
            invoice
        });
    } catch (error) {
        console.error("Update invoice status error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const getInvoiceHistory = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const history = await InvoiceStatusHistory.find({
            invoice: invoice._id
        })
            .populate("changedBy", "name email role")
            .sort({ createdAt: 1 });

        return res.json({ history });
    } catch (error) {
        console.error("Get invoice history error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    updateInvoiceStatus,
    getInvoiceHistory
};
