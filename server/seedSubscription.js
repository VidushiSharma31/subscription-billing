require("dotenv").config();

const mongoose = require("mongoose");

const connectDatabase = require("./config/db");
const User = require("./models/User");
const Subscription = require("./models/Subscription");

const seedSubscriptions = async () => {
    try {
        await connectDatabase();

        const admin = await User.findOne({
            role: "billing_admin"
        });

        const accountManager = await User.findOne({
            role: "account_manager"
        });

        if (!admin || !accountManager) {
            throw new Error(
                "Please create at least one Billing Admin and one Account Manager first."
            );
        }

        const subscriptions = [
            {
                customerName: "Acme Corporation",
                billingEmail: "billing@acme.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 4999,
                startDate: "2026-01-10",
                owner: admin._id,
                collaborators: [accountManager._id],
                status: "active"
            },
            {
                customerName: "TechNova Solutions",
                billingEmail: "billing@technova.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 75000,
                startDate: "2026-02-15",
                owner: admin._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "GreenLeaf Industries",
                billingEmail: "accounts@greenleaf.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 1999,
                startDate: "2026-03-05",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "PixelWorks Studio",
                billingEmail: "finance@pixelworks.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 5499,
                startDate: "2026-03-20",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "CloudPeak Systems",
                billingEmail: "billing@cloudpeak.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 120000,
                startDate: "2026-04-01",
                owner: admin._id,
                collaborators: [accountManager._id],
                status: "active"
            },
            {
                customerName: "BrightPath Education",
                billingEmail: "finance@brightpath.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 2499,
                startDate: "2026-04-12",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "UrbanCart Retail",
                billingEmail: "accounts@urbancart.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 6999,
                startDate: "2026-05-03",
                owner: admin._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "MediCore Health",
                billingEmail: "billing@medicore.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 95000,
                startDate: "2026-05-18",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "NorthStar Consulting",
                billingEmail: "finance@northstar.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 4499,
                startDate: "2026-06-01",
                owner: admin._id,
                collaborators: [accountManager._id],
                status: "active"
            },
            {
                customerName: "BlueOrbit Media",
                billingEmail: "billing@blueorbit.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 1799,
                startDate: "2026-06-10",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "FinEdge Analytics",
                billingEmail: "accounts@finedge.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 110000,
                startDate: "2026-06-25",
                owner: admin._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "Sunrise Hospitality",
                billingEmail: "billing@sunrise.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 5999,
                startDate: "2026-07-02",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "NovaTech Labs",
                billingEmail: "finance@novatech.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 2299,
                startDate: "2026-07-15",
                owner: admin._id,
                collaborators: [accountManager._id],
                status: "active"
            },
            {
                customerName: "SilverLine Logistics",
                billingEmail: "accounts@silverline.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 85000,
                startDate: "2026-07-28",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "MapleWorks Design",
                billingEmail: "billing@mapleworks.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 4799,
                startDate: "2026-08-03",
                owner: admin._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "Vertex Security",
                billingEmail: "finance@vertexsecurity.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 135000,
                startDate: "2026-08-11",
                owner: admin._id,
                collaborators: [accountManager._id],
                status: "active"
            },
            {
                customerName: "FreshBasket Foods",
                billingEmail: "accounts@freshbasket.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 1599,
                startDate: "2026-08-19",
                owner: accountManager._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "OrbitWorks Technologies",
                billingEmail: "billing@orbitworks.com",
                planName: "Pro",
                billingCycle: "monthly",
                price: 6499,
                startDate: "2026-08-25",
                owner: admin._id,
                collaborators: [],
                status: "active"
            },
            {
                customerName: "Evergreen Manufacturing",
                billingEmail: "finance@evergreen.com",
                planName: "Enterprise",
                billingCycle: "annual",
                price: 100000,
                startDate: "2026-09-01",
                owner: accountManager._id,
                collaborators: [],
                status: "archived"
            },
            {
                customerName: "Redwood Ventures",
                billingEmail: "billing@redwood.com",
                planName: "Basic",
                billingCycle: "monthly",
                price: 2099,
                startDate: "2026-09-05",
                owner: admin._id,
                collaborators: [],
                status: "archived"
            }
        ];

        const createdSubscriptions = await Subscription.insertMany(
            subscriptions
        );

        console.log(
            `Created ${createdSubscriptions.length} subscriptions.`
        );

        await mongoose.connection.close();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Seeding failed:", error.message);

        await mongoose.connection.close();
        process.exit(1);
    }
};

seedSubscriptions();