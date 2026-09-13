require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const alertRoutes = require("./routes/alertRoutes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    res.status(500).json({
        message: "Something went wrong"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
        console.error("MONGODB_URI and JWT_SECRET must be set");
        process.exit(1);
    }

    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();