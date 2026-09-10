const Subscription = require("../models/Subscription");
const User = require("../models/User");

const {
    getAccessibleSubscription
} = require("../utils/subscriptionAccess");

const createSubscription = async (req, res) => {
    try {
        const {
            customerName,
            billingEmail,
            planName,
            billingCycle,
            price,
            startDate
        } = req.body;

        if (
            !customerName ||
            !billingEmail ||
            !planName ||
            !billingCycle ||
            price === undefined ||
            !startDate
        ) {
            return res.status(400).json({
                message: "All subscription fields are required"
            });
        }

        if (!["monthly", "annual"].includes(billingCycle)) {
            return res.status(400).json({
                message: "Billing cycle must be monthly or annual"
            });
        }

        if (typeof price !== "number" || price < 0) {
            return res.status(400).json({
                message: "Price must be a non-negative number"
            });
        }

        const subscription = await Subscription.create({
            customerName,
            billingEmail,
            planName,
            billingCycle,
            price,
            startDate,
            owner: req.user.userId
        });

        res.status(201).json({
            message: "Subscription created successfully",
            subscription
        });
    } catch (error) {
        console.error("Create subscription error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getSubscriptions = async (req, res) => {
    try {
        const {
            search,
            status,
            billingCycle,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        // Account Managers can only access subscriptions
        // they own or collaborate on.
        if (req.user.role === "account_manager") {
            filter.$or = [
                { owner: req.user.userId },
                { collaborators: req.user.userId }
            ];
        }

        // Filter by status
        if (status) {
            if (!["active", "archived"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid subscription status"
                });
            }

            filter.status = status;
        }

        // Filter by billing cycle
        if (billingCycle) {
            if (!["monthly", "annual"].includes(billingCycle)) {
                return res.status(400).json({
                    message: "Invalid billing cycle"
                });
            }

            filter.billingCycle = billingCycle;
        }

        // Search customer name, billing email, or plan name
        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: "i" } },
                { billingEmail: { $regex: search, $options: "i" } },
                { planName: { $regex: search, $options: "i" } }
            ];
        }

        const allowedSortFields = [
            "customerName",
            "planName",
            "price",
            "startDate",
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

        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1
        };

        const skip = (pageNumber - 1) * pageSize;

        const [subscriptions, total] = await Promise.all([
            Subscription.find(filter)
                .populate("owner", "name email role")
                .populate("collaborators", "name email role")
                .sort(sort)
                .skip(skip)
                .limit(pageSize),

            Subscription.countDocuments(filter)
        ]);

        res.json({
            subscriptions,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error("Get subscriptions error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getSubscription = async (req, res) => {
    try {
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        await subscription.populate([
            {
                path: "owner",
                select: "name email role"
            },
            {
                path: "collaborators",
                select: "name email role"
            }
        ]);

        res.json({
            subscription
        });
    } catch (error) {
        console.error("Get subscription error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const updateSubscription = async (req, res) => {
    try {
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const {
            customerName,
            billingEmail,
            planName,
            billingCycle,
            price,
            startDate
        } = req.body;

        if (
            !customerName ||
            !billingEmail ||
            !planName ||
            !billingCycle ||
            price === undefined ||
            !startDate
        ) {
            return res.status(400).json({
                message: "All subscription fields are required"
            });
        }

        if (!["monthly", "annual"].includes(billingCycle)) {
            return res.status(400).json({
                message: "Billing cycle must be monthly or annual"
            });
        }

        if (typeof price !== "number" || price < 0) {
            return res.status(400).json({
                message: "Price must be a non-negative number"
            });
        }

        subscription.customerName = customerName;
        subscription.billingEmail = billingEmail;
        subscription.planName = planName;
        subscription.billingCycle = billingCycle;
        subscription.price = price;
        subscription.startDate = startDate;

        await subscription.save();

        res.json({
            message: "Subscription updated successfully",
            subscription
        });
    } catch (error) {
        console.error("Update subscription error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const archiveSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (subscription.status === "archived") {
            return res.status(400).json({
                message: "Subscription is already archived"
            });
        }

        subscription.status = "archived";

        await subscription.save();

        res.json({
            message: "Subscription archived successfully",
            subscription
        });
    } catch (error) {
        console.error("Archive subscription error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const restoreSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (subscription.status === "active") {
            return res.status(400).json({
                message: "Subscription is already active"
            });
        }

        subscription.status = "active";

        await subscription.save();

        res.json({
            message: "Subscription restored successfully",
            subscription
        });
    } catch (error) {
        console.error("Restore subscription error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const updateCollaborators = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const { collaboratorIds } = req.body;

        if (!Array.isArray(collaboratorIds)) {
            return res.status(400).json({
                message: "collaboratorIds must be an array"
            });
        }

        const users = await User.find({
            _id: { $in: collaboratorIds }
        }).select("_id role");

        if (users.length !== collaboratorIds.length) {
            return res.status(400).json({
                message: "One or more collaborators do not exist"
            });
        }

        const nonManagers = users.filter(
            (user) => user.role !== "account_manager"
        );

        if (nonManagers.length > 0) {
            return res.status(400).json({
                message: "Only Account Managers can be collaborators"
            });
        }

        if (collaboratorIds.includes(subscription.owner.toString())) {
            return res.status(400).json({
                message: "The subscription owner cannot be a collaborator"
            });
        }

        subscription.collaborators = collaboratorIds;

        await subscription.save();

        await subscription.populate({
            path: "collaborators",
            select: "name email role"
        });

        res.json({
            message: "Collaborators updated successfully",
            subscription
        });
    } catch (error) {
        console.error("Update collaborators error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    createSubscription,
    getSubscriptions,
    getSubscription,
    updateSubscription,
    archiveSubscription,
    restoreSubscription,
    updateCollaborators
};