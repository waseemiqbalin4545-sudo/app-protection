const db = require("../config/db");
const { generateApiKey } = require("../utils/apiKey");

/*
========================================
ADD APP
========================================
*/
exports.addApp = async (req, res) => {
    try {
        const {
            app_name,
            package_name,
            version
        } = req.body;

        if (!app_name || !package_name) {
            return res.status(400).json({
                success: false,
                message: "App Name & Package Required"
            });
        }

        // Check duplicate package
        const check = await db.query(
            "SELECT id FROM apps WHERE package_name=$1 LIMIT 1",
            [package_name]
        );

        if (check.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Package Already Exists"
            });
        }

        const api_key = generateApiKey();

        const result = await db.query(
            `INSERT INTO apps
            (app_name, package_name, api_key, version, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                app_name,
                package_name,
                api_key,
                version || "1.0",
                true
            ]
        );

        return res.status(201).json({
            success: true,
            message: "App Added",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ADD APP ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


/*
========================================
GET ALL APPS
========================================
*/
exports.getApps = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM apps ORDER BY id DESC"
        );

        return res.json({
            success: true,
            total: result.rows.length,
            data: result.rows
        });

    } catch (err) {
        console.error("GET APPS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


/*
========================================
GET SINGLE APP
========================================
*/
exports.getApp = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM apps WHERE id=$1 LIMIT 1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "App Not Found"
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("GET APP ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


/*
========================================
DELETE APP
========================================
*/
exports.deleteApp = async (req, res) => {
    try {
        const result = await db.query(
            "DELETE FROM apps WHERE id=$1 RETURNING *",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "App Not Found"
            });
        }

        return res.json({
            success: true,
            message: "App Deleted",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("DELETE APP ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};
