require("dotenv").config();

const mongoose = require("mongoose");

const User = require("./models/User");
const { hashPassword } = require("./utils/password");

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB");

        const adminPassword = await hashPassword("admin123");
        const manager1Password = await hashPassword("manager123");
        const manager2Password = await hashPassword("manager456");

        await User.deleteMany({
            email: {
                $in: ["admin@example.com", "manager1@example.com", "manager2@example.com"]
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
                name: "Account Manager 1",
                email: "manager1@example.com",
                password: manager1Password,
                role: "account_manager"
            },
            {
                name: "Account Manager 2",
                email: "manager2@example.com",
                password: manager2Password,
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