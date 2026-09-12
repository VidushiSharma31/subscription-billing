const User = require("../models/User");
const { comparePassword } = require("../utils/password");
const generateToken = require("../utils/token");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await comparePassword(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

/*
 * Return all account managers.
 *
 * This is used by the invoice filters so the frontend
 * can display the available invoice owners.
 *
 * Only Billing Admins should be able to request the
 * complete list of account managers.
 */
const getAccountManagers = async (req, res) => {
    try {
        const accountManagers = await User.find({
            role: "account_manager"
        })
            .select("_id name email")
            .sort({ name: 1 });

        res.json({
            accountManagers
        });
    } catch (error) {
        console.error("Get account managers error:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

module.exports = {
    login,
    getAccountManagers
};