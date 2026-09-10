require("dotenv").config();

const mongoose = require("mongoose");

const User = require("./models/User");
const { hashPassword } = require("./utils/password");

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB");

        const adminPassword = await hashPassword("admin123");
        const managerPassword = await hashPassword("manager123");

        await User.deleteMany({
            email: {
                $in: ["admin@example.com", "manager@example.com"]
            }
        });

        await User.create([
            {
                name: "Billing Admin",
                email: "admin@example.com",
                password: adminPassword,
                role: "billing_admin"
            },
            {
                name: "Account Manager",
                email: "manager@example.com",
                password: managerPassword,
                role: "account_manager"
            }
        ]);

        console.log("Demo users created successfully");

        await mongoose.disconnect();
    } catch (error) {
        console.error("Seeding failed:", error.message);
        process.exit(1);
    }
};

seedUsers();