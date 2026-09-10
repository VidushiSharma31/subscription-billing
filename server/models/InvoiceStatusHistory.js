const mongoose = require("mongoose");

const invoiceStatusHistorySchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true
        },

        oldStatus: {
            type: String,
            enum: ["draft", "issued", "paid", "void"],
            required: true
        },

        newStatus: {
            type: String,
            enum: ["draft", "issued", "paid", "void"],
            required: true
        },

        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "InvoiceStatusHistory",
    invoiceStatusHistorySchema
);