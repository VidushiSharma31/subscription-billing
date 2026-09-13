const express = require("express");

const {
    login,
    getAccountManagers
} = require("../controllers/authController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", login);

router.get(
    "/me",
    authenticateUser,
    (req, res) => {
        res.json({
            user: req.user
        });
    }
);

router.get(
    "/account-managers",
    authenticateUser,
    authorizeRoles("billing_admin"),
    getAccountManagers
);

module.exports = router;