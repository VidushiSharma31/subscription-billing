const mongoose = require("mongoose");

const subscriptionAuditSchema = new mongoose.Schema(
    {
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            required: true,
            index: true
        },

        action: {
            type: String,
            enum: [
                "created",
                "updated",
                "archived",
                "restored",
                "collaborators_updated"
            ],
            required: true
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        details: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Audit records are append-only. There are intentionally no update/delete routes.
module.exports = mongoose.model("SubscriptionAudit", subscriptionAuditSchema);