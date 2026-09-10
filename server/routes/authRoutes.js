const express = require("express");

const { login } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticateUser, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

module.exports = router;