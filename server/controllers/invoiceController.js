const Invoice = require("../models/Invoice");
const Subscription = require("../models/Subscription");

const { getAccessibleInvoice } = require("../utils/invoiceAccess");
const { isInvoiceOverdue } = require("../utils/invoiceStatus");

const createInvoice = async (req, res) => {
    try {
        const {
            subscription,
            periodStart,
            periodEnd,
            amount,
            dueDate
        } = req.body;

        if (
            !subscription ||
            !periodStart ||
            !periodEnd ||
            amount === undefined ||
            !dueDate
        ) {
            return res.status(400).json({
                message: "All invoice fields are required"
            });
        }

        const subscriptionDoc = await Subscription.findById(subscription);

        if (!subscriptionDoc) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const hasAccess =
            req.user.role === "billing_admin" ||
            subscriptionDoc.owner.toString() === req.user.userId ||
            subscriptionDoc.collaborators.some(
                (collaboratorId) =>
                    collaboratorId.toString() === req.user.userId
            );

        if (!hasAccess) {
            return res.status(403).json({
                message: "You do not have access to this subscription"
            });
        }

        if (subscriptionDoc.status !== "active") {
            return res.status(400).json({
                message:
                    "Cannot create an invoice for an archived subscription"
            });
        }

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return res.status(400).json({
                message: "Amount must be a non-negative number"
            });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        const due = new Date(dueDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            Number.isNaN(due.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date provided"
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message: "Period end must be after period start"
            });
        }

        const invoice = await Invoice.create({
            subscription,
            periodStart: start,
            periodEnd: end,
            amount,
            dueDate: due,
            status: "draft"
        });

        return res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });
    } catch (error) {
        console.error("Create invoice error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const getInvoices = async (req, res) => {
    try {
        const {
            search,
            status,
            subscription,
            owner,
            overdue,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        /*
         * Account Managers can only see invoices belonging
         * to subscriptions they own or collaborate on.
         */
        let accessibleSubscriptionIds = null;

        if (req.user.role === "account_manager") {
            const accessibleSubscriptions = await Subscription.find({
                $or: [
                    {
                        owner: req.user.userId
                    },
                    {
                        collaborators: req.user.userId
                    }
                ]
            }).select("_id");

            accessibleSubscriptionIds = accessibleSubscriptions.map(
                (item) => item._id
            );
        }


        /*
         * Search customer name, billing email, or plan name.
         */
        if (search && search.trim()) {
            const searchRegex = {
                $regex: search.trim(),
                $options: "i"
            };

            const subscriptionSearchFilter = {
                $or: [
                    {
                        customerName: searchRegex
                    },
                    {
                        billingEmail: searchRegex
                    },
                    {
                        planName: searchRegex
                    }
                ]
            };

            /*
             * Account Managers should only search within
             * subscriptions they can access.
             */
            if (accessibleSubscriptionIds) {
                subscriptionSearchFilter._id = {
                    $in: accessibleSubscriptionIds
                };
            }

            const matchingSubscriptions = await Subscription.find(
                subscriptionSearchFilter
            ).select("_id");

            filter.subscription = {
                $in: matchingSubscriptions.map(
                    (item) => item._id
                )
            };
        }


        /*
         * Filter by a specific subscription.
         */
        if (subscription) {
            if (accessibleSubscriptionIds) {
                const hasAccess = accessibleSubscriptionIds.some(
                    (id) => id.toString() === subscription
                );

                if (!hasAccess) {
                    return res.json({
                        invoices: [],
                        pagination: {
                            page: Number(page),
                            limit: Number(limit),
                            total: 0,
                            totalPages: 0
                        }
                    });
                }
            }

            filter.subscription = subscription;
        }


        /*
         * Filter by invoice status.
         */
        if (status) {
            if (
                ![
                    "draft",
                    "issued",
                    "paid",
                    "void"
                ].includes(status)
            ) {
                return res.status(400).json({
                    message: "Invalid invoice status"
                });
            }

            filter.status = status;
        }


        /*
         * Filter by overdue status.
         *
         * Only Issued invoices can be overdue.
         */
        if (overdue === "true") {
            if (status && status !== "issued") {
                return res.json({
                    invoices: [],
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: 0,
                        totalPages: 0
                    }
                });
            }

            filter.status = "issued";
            filter.dueDate = {
                $lt: new Date()
            };
        }


        /*
         * Filter for invoices that are not overdue.
         */
        if (overdue === "false") {
            if (status === "issued") {
                filter.dueDate = {
                    $gte: new Date()
                };
            } else if (!status) {
                filter.$or = [
                    {
                        status: {
                            $ne: "issued"
                        }
                    },
                    {
                        dueDate: {
                            $gte: new Date()
                        }
                    }
                ];
            }
        }


        /*
        * Filter by owning Account Manager.
        *
        * The owner belongs to the Subscription.
        * If a subscription filter is also present,
        * both conditions must be satisfied.
        */
        if (owner) {
            const ownerSubscriptions = await Subscription.find({
                owner
            }).select("_id");

            const ownerSubscriptionIds =
                ownerSubscriptions.map(
                    (subscription) => subscription._id
                );

            /*
            * Account Managers can only see subscriptions
            * they own or collaborate on.
            */
            let allowedOwnerSubscriptionIds =
                ownerSubscriptionIds;

            if (accessibleSubscriptionIds) {
                const accessibleIds = new Set(
                    accessibleSubscriptionIds.map(
                        (id) => id.toString()
                    )
                );

                allowedOwnerSubscriptionIds =
                    ownerSubscriptionIds.filter(
                        (id) =>
                            accessibleIds.has(
                                id.toString()
                            )
                    );
            }

            /*
            * If a specific subscription was also selected,
            * make sure it belongs to the selected owner.
            *
            * Example:
            *
            * Owner = Manager A
            * Subscription = Manager A's Subscription 1
            * → return Subscription 1
            *
            * Owner = Manager A
            * Subscription = Manager B's Subscription 2
            * → return nothing
            */
            if (filter.subscription) {
                const selectedSubscriptionId =
                    filter.subscription.toString();

                const belongsToOwner =
                    allowedOwnerSubscriptionIds.some(
                        (id) =>
                            id.toString() ===
                            selectedSubscriptionId
                    );

                if (!belongsToOwner) {
                    /*
                    * No subscription can satisfy both
                    * filters.
                    */
                    filter.subscription = {
                        $in: []
                    };
                }
            } else {
                /*
                * Only owner filter is active.
                */
                filter.subscription = {
                    $in: allowedOwnerSubscriptionIds
                };
            }
        }


        /*
         * Validate sorting.
         */
        const allowedSortFields = [
            "amount",
            "dueDate",
            "periodStart",
            "periodEnd",
            "createdAt"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                message: "Invalid sort field"
            });
        }

        if (
            !["asc", "desc"].includes(sortOrder)
        ) {
            return res.status(400).json({
                message: "Invalid sort order"
            });
        }


        /*
         * Validate pagination.
         */
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


        /*
         * General Account Manager access restriction.
         *
         * This is applied when no more specific subscription
         * filter has already been created.
         */
        if (
            accessibleSubscriptionIds &&
            !filter.subscription
        ) {
            filter.subscription = {
                $in: accessibleSubscriptionIds
            };
        }


        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1
        };

        const skip =
            (pageNumber - 1) * pageSize;


        const [
            invoices,
            total
        ] = await Promise.all([
            Invoice.find(filter)
                .populate({
                    path: "subscription",
                    select:
                        "customerName billingEmail planName billingCycle owner"
                })
                .sort(sort)
                .skip(skip)
                .limit(pageSize),

            Invoice.countDocuments(filter)
        ]);


        const invoicesWithOverdue =
            invoices.map((invoice) => ({
                ...invoice.toObject(),
                overdue: isInvoiceOverdue(invoice)
            }));


        return res.json({
            invoices: invoicesWithOverdue,

            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages:
                    Math.ceil(
                        total / pageSize
                    )
            }
        });
    } catch (error) {
        console.error(
            "Get invoices error:",
            error
        );

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const getInvoice = async (req, res) => {
    try {
        const invoice =
            await getAccessibleInvoice(
                req.params.id,
                req.user
            );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        await invoice.populate({
            path: "subscription",
            select:
                "customerName billingEmail planName billingCycle price startDate owner collaborators"
        });

        return res.json({
            invoice
        });
    } catch (error) {
        console.error(
            "Get invoice error:",
            error
        );

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const updateInvoiceDraft = async (req, res) => {
    try {
        const invoice =
            await getAccessibleInvoice(
                req.params.id,
                req.user
            );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status !== "draft") {
            return res.status(400).json({
                message:
                    "Only draft invoices can be edited this way"
            });
        }

        const {
            periodStart,
            periodEnd,
            amount,
            dueDate
        } = req.body;

        if (
            !periodStart ||
            !periodEnd ||
            amount === undefined ||
            !dueDate
        ) {
            return res.status(400).json({
                message:
                    "All invoice fields are required"
            });
        }

        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return res.status(400).json({
                message:
                    "Amount must be a non-negative number"
            });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        const due = new Date(dueDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            Number.isNaN(due.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date provided"
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message:
                    "Period end must be after period start"
            });
        }

        invoice.periodStart = start;
        invoice.periodEnd = end;
        invoice.amount = amount;
        invoice.dueDate = due;

        await invoice.save();

        return res.json({
            message:
                "Invoice updated successfully",
            invoice
        });
    } catch (error) {
        console.error(
            "Update invoice draft error:",
            error
        );

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


const updateInvoiceDueDate = async (req, res) => {
    try {
        const {
            dueDate
        } = req.body;

        if (!dueDate) {
            return res.status(400).json({
                message: "Due date is required"
            });
        }

        const parsedDueDate =
            new Date(dueDate);

        if (
            Number.isNaN(
                parsedDueDate.getTime()
            )
        ) {
            return res.status(400).json({
                message: "Invalid due date"
            });
        }

        const invoice =
            await getAccessibleInvoice(
                req.params.id,
                req.user
            );

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status === "paid") {
            return res.status(400).json({
                message:
                    "Paid invoices cannot be modified"
            });
        }

        if (invoice.status === "void") {
            return res.status(400).json({
                message:
                    "Void invoices cannot be modified"
            });
        }

        invoice.dueDate =
            parsedDueDate;

        await invoice.save();

        return res.json({
            message:
                "Invoice due date updated successfully",
            invoice
        });
    } catch (error) {
        console.error(
            "Update invoice due date error:",
            error
        );

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};


module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoiceDraft,
    updateInvoiceDueDate
};