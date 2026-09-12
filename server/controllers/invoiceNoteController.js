const InvoiceNote = require("../models/InvoiceNote");
const { getAccessibleInvoice } = require("../utils/invoiceAccess");

const addInvoiceNote = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Note text is required" });
        }

        const note = await InvoiceNote.create({
            invoice: invoice._id,
            text: text.trim(),
            createdBy: req.user.userId
        });

        await note.populate("createdBy", "name email role");

        return res.status(201).json({
            message: "Invoice note added successfully",
            note
        });
    } catch (error) {
        console.error("Add invoice note error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const getInvoiceNotes = async (req, res) => {
    try {
        const invoice = await getAccessibleInvoice(req.params.id, req.user);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const notes = await InvoiceNote.find({
            invoice: invoice._id
        })
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        return res.json({ notes });
    } catch (error) {
        console.error("Get invoice notes error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = {
    addInvoiceNote,
    getInvoiceNotes
};
