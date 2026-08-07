const db = require("../config/db");
const { generateApiKey } = require("../utils/apiKey");

/*
=========================
Add App
=========================
*/

exports.addApp = async (req, res) => {

    try {

        const {
            app_name,
            package_name,
            version
        } = req.body;

        if (!app_name || !package_name) {

            return res.json({
                success: false,
                message: "App Name & Package Required"
            });

        }

        const check = await db.query(

            "SELECT id FROM apps WHERE package_name=$1",

            [package_name]

        );

        if (check.rows.length > 0) {

            return res.json({

                success: false,

                message: "Package Already Exists"

            });

        }

        const api_key = generateApiKey();

        const result = await db.query(

            `INSERT INTO apps
            (app_name,package_name,api_key,version,status)
            VALUES($1,$2,$3,$4,$5)
            RETURNING *`,

            [

                app_name,

                package_name,

                api_key,

                version || "1.0",

                true

            ]

        );

        res.json({

            success: true,

            message: "App Added",

            data: result.rows[0]

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
=========================
All Apps
=========================
*/

exports.getApps = async (req, res) => {

    try {

        const result = await db.query(

            "SELECT * FROM apps ORDER BY id DESC"

        );

        res.json({

            success: true,

            total: result.rows.length,

            data: result.rows

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
=========================
Single App
=========================
*/

exports.getApp = async (req, res) => {

    try {

        const result = await db.query(

            "SELECT * FROM apps WHERE id=$1",

            [req.params.id]

        );

        if (result.rows.length == 0) {

            return res.json({

                success: false,

                message: "App Not Found"

            });

        }

        res.json({

            success: true,

            data: result.rows[0]

        });

    }

    catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
=========================
Delete App
=========================
*/

exports.deleteApp = async (req, res) => {

    try {

        await db.query(

            "DELETE FROM apps WHERE id=$1",

            [req.params.id]

        );

        res.json({

            success: true,

            message: "App Deleted"

        });

    }

    catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
