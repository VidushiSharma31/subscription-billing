const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true
        },

        billingEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        planName: {
            type: String,
            required: true,
            trim: true
        },

        billingCycle: {
            type: String,
            enum: ["monthly", "annual"],
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        startDate: {
            type: Date,
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        collaborators: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);