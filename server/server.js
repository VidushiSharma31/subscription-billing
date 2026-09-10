require("dotenv").config();

const express = require("express");
const connectDatabase = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

app.get("/api/health", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

const startServer = async () => {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();