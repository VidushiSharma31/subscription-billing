const express = require("express");

const { login } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticateUser, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});

router.get("/admin-test",
    authenticateUser,
    authorizeRoles("billing_admin"),
    (req, res) => {
        res.json({
            message: "You are authorized as a Billing Admin"
        });
    }
);

module.exports = router;