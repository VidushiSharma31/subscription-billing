const mongoose = require("mongoose");

const overdueAlertSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
            unique: true
        },
        dueDateSnapshot: {
            type: Date,
            required: true
        },
        dismissedAt: {
            type: Date,
            default: null
        },
        dismissedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("OverdueAlert", overdueAlertSchema);
