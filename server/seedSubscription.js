require("dotenv").config();

const mongoose = require("mongoose");

const connectDatabase = require("./config/db");

const User = require("./models/User");
const Subscription = require("./models/Subscription");
const Invoice = require("./models/Invoice");
const InvoiceStatusHistory = require("./models/InvoiceStatusHistory");
const InvoiceNote = require("./models/InvoiceNote");
const CreditNote = require("./models/CreditNote");

const seedData = async () => {
    try {
        await connectDatabase();

        // --------------------------------------------------
        // 1. Find users
        // --------------------------------------------------

        const admin = await User.findOne({
            role: "billing_admin"
        });

        const accountManagers = await User.find({
            role: "account_manager"
        }).limit(3);

        if (!admin) {
            throw new Error(
                "No Billing Admin found. Create an admin user first."
            );
        }

        if (accountManagers.length < 2) {
            throw new Error(
                "At least 2 Account Managers are required for testing."
            );
        }

        const manager1 = accountManagers[1];
        const manager2 = accountManagers[2];

        // --------------------------------------------------
        // 2. Clear existing billing test data
        // --------------------------------------------------

        console.log("Clearing existing billing data...");

        await CreditNote.deleteMany({});
        await InvoiceNote.deleteMany({});
        await InvoiceStatusHistory.deleteMany({});
        await Invoice.deleteMany({});
        await Subscription.deleteMany({});

        // --------------------------------------------------
        // 3. Date helpers
        // --------------------------------------------------

        const today = new Date();

        const daysFromToday = (days) => {
            const date = new Date(today);
            date.setDate(date.getDate() + days);
            return date;
        };

        const daysAgo = (days) => {
            return daysFromToday(-days);
        };

        const startOfCurrentMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        const endOfCurrentMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );

        const startOfNextMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            1
        );

        const endOfPreviousMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        );

        // --------------------------------------------------
        // 4. Create subscriptions
        // --------------------------------------------------

        const subscriptions = await Subscription.insertMany([
            // Admin-owned active monthly
            {
                customerName: "Acme Technologies",
                billingEmail: "billing@acmetech.com",
                planName: "Enterprise",
                billingCycle: "monthly",
                price: 50000,
                startDate: daysAgo(180),
                owner: admin._id,
                collaborators: [manager1._id],
                status: "active"
            },

            // Admin-owned active annual
            {
                customerName: "Nova Solutions",
                billingEmail: "finance@novasolutions.com",
                planName: "Pro",
                billingCycle: "annual",
                price: 120000,
                startDate: daysAgo(240),
                owner: admin._id,
                collaborators: [manager2._id],
                status: "active"
            },

            // Admin-owned active monthly, no collaborators
            {
                customerName: "BluePeak Systems",
                billingEmail: "accounts@bluepeak.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 8000,
                startDate: daysAgo(90),
                owner: admin._id,
                collaborators: [],
                status: "active"
            },

            // Manager 1 owned
            {
                customerName: "GreenLeaf Retail",
                billingEmail: "billing@greenleaf.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 18000,
                startDate: daysAgo(150),
                owner: manager1._id,
                collaborators: [],
                status: "active"
            },

            // Manager 1 owned + manager 2 collaborator
            {
                customerName: "Vertex Consulting",
                billingEmail: "finance@vertexconsulting.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 200000,
                startDate: daysAgo(300),
                owner: manager1._id,
                collaborators: [manager2._id],
                status: "active"
            },

            // Manager 2 owned
            {
                customerName: "PixelWorks Studio",
                billingEmail: "billing@pixelworks.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 6000,
                startDate: daysAgo(75),
                owner: manager2._id,
                collaborators: [],
                status: "active"
            },

            // Manager 2 owned + manager 1 collaborator
            {
                customerName: "Orion Media",
                billingEmail: "accounts@orionmedia.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 25000,
                startDate: daysAgo(210),
                owner: manager2._id,
                collaborators: [manager1._id],
                status: "active"
            },

            // Archived admin subscription
            {
                customerName: "Legacy Industries",
                billingEmail: "billing@legacyindustries.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 150000,
                startDate: daysAgo(500),
                owner: admin._id,
                collaborators: [],
                status: "archived"
            },

            // Archived manager subscription
            {
                customerName: "OldTown Services",
                billingEmail: "finance@oldtown.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 5000,
                startDate: daysAgo(400),
                owner: manager1._id,
                collaborators: [],
                status: "archived"
            },

            // Another active admin subscription
            {
                customerName: "Summit Analytics",
                billingEmail: "billing@summitanalytics.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 32000,
                startDate: daysAgo(45),
                owner: admin._id,
                collaborators: [manager1._id],
                status: "active"
            }
        ]);

        console.log(
            `Created ${subscriptions.length} subscriptions.`
        );

        // --------------------------------------------------
        // 5. Find useful subscriptions for invoice testing
        // --------------------------------------------------

        const acme = subscriptions.find(
            (subscription) =>
                subscription.customerName === "Acme Technologies"
        );

        const nova = subscriptions.find(
            (subscription) =>
                subscription.customerName === "Nova Solutions"
        );

        const bluePeak = subscriptions.find(
            (subscription) =>
                subscription.customerName === "BluePeak Systems"
        );

        const greenLeaf = subscriptions.find(
            (subscription) =>
                subscription.customerName === "GreenLeaf Retail"
        );

        // --------------------------------------------------
        // 6. Create invoices
        // --------------------------------------------------

        const invoices = [];

        // Draft invoice
        invoices.push(
            await Invoice.create({
                subscription: bluePeak._id,
                periodStart: startOfCurrentMonth,
                periodEnd: endOfCurrentMonth,
                amount: bluePeak.price,
                dueDate: daysFromToday(30),
                status: "draft"
            })
        );

        // Issued but NOT overdue
        invoices.push(
            await Invoice.create({
                subscription: acme._id,
                periodStart: endOfPreviousMonth,
                periodEnd: startOfCurrentMonth,
                amount: acme.price,
                dueDate: daysFromToday(10),
                status: "issued"
            })
        );

        // Issued and OVERDUE
        invoices.push(
            await Invoice.create({
                subscription: greenLeaf._id,
                periodStart: daysAgo(60),
                periodEnd: daysAgo(30),
                amount: greenLeaf.price,
                dueDate: daysAgo(10),
                status: "issued"
            })
        );

        // Paid invoice
        invoices.push(
            await Invoice.create({
                subscription: nova._id,
                periodStart: daysAgo(90),
                periodEnd: daysAgo(60),
                amount: nova.price,
                dueDate: daysAgo(30),
                status: "paid"
            })
        );

        // Void invoice
        invoices.push(
            await Invoice.create({
                subscription: bluePeak._id,
                periodStart: daysAgo(120),
                periodEnd: daysAgo(90),
                amount: bluePeak.price,
                dueDate: daysAgo(60),
                status: "void"
            })
        );

        console.log(
            `Created ${invoices.length} invoices.`
        );

        // --------------------------------------------------
        // 7. Create status history
        // --------------------------------------------------

        const issuedInvoice = invoices[1];
        const overdueInvoice = invoices[2];
        const paidInvoice = invoices[3];
        const voidInvoice = invoices[4];

        await InvoiceStatusHistory.insertMany([
            {
                invoice: issuedInvoice._id,
                oldStatus: "draft",
                newStatus: "issued",
                changedBy: admin._id
            },

            {
                invoice: overdueInvoice._id,
                oldStatus: "draft",
                newStatus: "issued",
                changedBy: admin._id
            },

            {
                invoice: paidInvoice._id,
                oldStatus: "draft",
                newStatus: "issued",
                changedBy: admin._id
            },

            {
                invoice: paidInvoice._id,
                oldStatus: "issued",
                newStatus: "paid",
                changedBy: admin._id
            },

            {
                invoice: voidInvoice._id,
                oldStatus: "draft",
                newStatus: "void",
                changedBy: admin._id
            }
        ]);

        // --------------------------------------------------
        // 8. Add invoice notes
        // --------------------------------------------------

        await InvoiceNote.insertMany([
            {
                invoice: issuedInvoice._id,
                text: "Customer requested payment reminder before due date.",
                createdBy: admin._id
            },

            {
                invoice: overdueInvoice._id,
                text: "Payment is overdue. Follow-up required.",
                createdBy: manager1._id
            },

            {
                invoice: paidInvoice._id,
                text: "Payment received successfully.",
                createdBy: admin._id
            }
        ]);

        // --------------------------------------------------
        // 9. Add credit note to paid invoice
        // --------------------------------------------------

        await CreditNote.create({
            invoice: paidInvoice._id,
            amount: 10000,
            reason: "Partial service credit",
            createdBy: admin._id
        });

        console.log("Created invoice history, notes and credit note.");

        console.log("\nSeed completed successfully!");
        console.log("--------------------------------");
        console.log("Subscriptions:", subscriptions.length);
        console.log("Invoices:", invoices.length);
        console.log("Draft invoices: 1");
        console.log("Issued invoices: 2");
        console.log("Paid invoices: 1");
        console.log("Void invoices: 1");
        console.log("Overdue invoices: 1");
        console.log("Credit notes: 1");
        console.log("--------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
};

seedData();