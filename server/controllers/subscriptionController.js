const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { createSubscriptionAudit } = require("../utils/subscriptionAudit");
const { getAccessibleSubscription } = require("../utils/subscriptionAccess");
const { isValidMoney, toMoney } = require("../utils/money");

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

        if (!isValidMoney(price)) {
            return res.status(400).json({
                message: "Price must be a non-negative amount with up to two decimal places"
            });
        }

        let ownerId = req.user.userId;

        if (req.user.role === "billing_admin") {
            if (!req.body.owner) {
                return res.status(400).json({
                    message: "An owning account manager is required"
                });
            }

            const owner = await User.findById(req.body.owner);

            if (!owner || owner.role !== "account_manager") {
                return res.status(400).json({
                    message: "Owner must be an account manager"
                });
            }

            ownerId = owner._id;
        }

        const subscription = await Subscription.create({
            customerName,
            billingEmail,
            planName,
            billingCycle,
            price: toMoney(price),
            startDate,
            owner: ownerId
        });

        await createSubscriptionAudit({
            subscriptionId: subscription._id,
            action: "created",
            performedBy: req.user.userId,
            details: `Created subscription for ${subscription.customerName} on ${subscription.planName} plan.`
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
        const conditions = [];

        if (req.user.role === "account_manager") {
            conditions.push({
                $or: [
                    { owner: req.user.userId },
                    { collaborators: req.user.userId }
                ]
            });
        }

        if (status) {
            if (!["active", "archived"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid subscription status"
                });
            }

            filter.status = status;
        }

        if (billingCycle) {
            if (!["monthly", "annual"].includes(billingCycle)) {
                return res.status(400).json({
                    message: "Invalid billing cycle"
                });
            }

            filter.billingCycle = billingCycle;
        }

        if (search) {
            conditions.push({
                $or: [
                    { customerName: { $regex: search, $options: "i" } },
                    { billingEmail: { $regex: search, $options: "i" } },
                    { planName: { $regex: search, $options: "i" } }
                ]
            });
        }

        if (conditions.length === 1) {
            Object.assign(filter, conditions[0]);
        } else if (conditions.length > 1) {
            filter.$and = conditions;
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

        const changes = [];

        if (subscription.customerName !== customerName) {
            changes.push(`Customer: ${subscription.customerName} → ${customerName}`);
        }
        if (subscription.billingEmail !== billingEmail) {
            changes.push(`Billing email: ${subscription.billingEmail} → ${billingEmail}`);
        }
        if (subscription.planName !== planName) {
            changes.push(`Plan: ${subscription.planName} → ${planName}`);
        }
        if (subscription.billingCycle !== billingCycle) {
            changes.push(`Billing cycle: ${subscription.billingCycle} → ${billingCycle}`);
        }
        if (subscription.price !== price) {
            changes.push(`Price: ${subscription.price} → ${price}`);
        }
        if (new Date(subscription.startDate).getTime() !== new Date(startDate).getTime()) {
            changes.push(`Start date: ${new Date(subscription.startDate).toISOString().slice(0, 10)} → ${new Date(startDate).toISOString().slice(0, 10)}`);
        }

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

        if (!isValidMoney(price)) {
            return res.status(400).json({
                message: "Price must be a non-negative amount with up to two decimal places"
            });
        }

        subscription.customerName = customerName;
        subscription.billingEmail = billingEmail;
        subscription.planName = planName;
        subscription.billingCycle = billingCycle;
        subscription.price = toMoney(price);
        subscription.startDate = startDate;

        await subscription.save();

        if (changes.length > 0) {
            await createSubscriptionAudit({
                subscriptionId: subscription._id,
                action: "updated",
                performedBy: req.user.userId,
                details: changes.join(" | ")
            });
        }

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
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

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

        await createSubscriptionAudit({
            subscriptionId: subscription._id,
            action: "archived",
            performedBy: req.user.userId,
            details: "Subscription archived. Future invoice generation is stopped."
        });

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
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

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

        await createSubscriptionAudit({
            subscriptionId: subscription._id,
            action: "restored",
            performedBy: req.user.userId,
            details: "Subscription restored and is active again."
        });

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
        const subscription = await getAccessibleSubscription(
            req.params.id,
            req.user
        );

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
        }).select("_id name role");

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

        const previousCollaboratorIds = subscription.collaborators.map(
            (id) => id.toString()
        );

        const added = collaboratorIds.filter(
            (id) => !previousCollaboratorIds.includes(id.toString())
        );

        const removed = previousCollaboratorIds.filter(
            (id) => !collaboratorIds.map(String).includes(id)
        );

        subscription.collaborators = collaboratorIds;

        await subscription.save();

        if (added.length > 0 || removed.length > 0) {
            const namesById = new Map(
                users.map((user) => [user._id.toString(), user.name])
            );

            const addedNames = added.map(
                (id) => namesById.get(id.toString()) || id.toString()
            );

            const removedUsers = await User.find({
                _id: { $in: removed }
            }).select("_id name");

            const removedNames = removed.map((id) => {
                const user = removedUsers.find(
                    (item) => item._id.toString() === id.toString()
                );
                return user?.name || id.toString();
            });

            const parts = [];
            if (addedNames.length > 0) {
                parts.push(`Added: ${addedNames.join(", ")}`);
            }
            if (removedNames.length > 0) {
                parts.push(`Removed: ${removedNames.join(", ")}`);
            }

            await createSubscriptionAudit({
                subscriptionId: subscription._id,
                action: "collaborators_updated",
                performedBy: req.user.userId,
                details: parts.join(" | ")
            });
        }

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