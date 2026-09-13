const mongoose = require("mongoose");

const subscriptionAuditLogSchema = new mongoose.Schema(
    {
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            required: true
        },
        action: {
            type: String,
            enum: ["created", "archived", "restored", "collaborators_updated"],
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("SubscriptionAuditLog", subscriptionAuditLogSchema);