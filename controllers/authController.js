const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { generateToken } = require("../utils/jwt");

exports.login = async (req, res) => {
    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and Password required"
            });
        }

        const result = await db.query(
            "SELECT * FROM admins WHERE username=$1 LIMIT 1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid Username"
            });
        }

        const admin = result.rows[0];

        let passwordMatch = false;

        if (admin.password.startsWith("$2")) {
            passwordMatch = await bcrypt.compare(password, admin.password);
        } else {
            passwordMatch = password === admin.password;
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        if (admin.status === false) {
            return res.status(403).json({
                success: false,
                message: "Admin Disabled"
            });
        }

        const token = generateToken(admin);

        res.json({
            success: true,
            message: "Login Successful",
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                role: admin.role
            }
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};
