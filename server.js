require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const JWT_SECRET = process.env.JWT_SECRET || "gsm_aashi_secret_key";

/*
==========================================
Database Test
==========================================
*/

pool.connect()
    .then(client => {
        console.log("✅ PostgreSQL Connected");
        client.release();
    })
    .catch(err => {
        console.error("Database Error:", err);
    });

/*
==========================================
Middleware
==========================================
*/

function verifyToken(req, res, next) {

    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token Missing"
        });
    }

    try {

        const decoded = jwt.verify(
            token.replace("Bearer ", ""),
            JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }

}

/*
==========================================
Home
==========================================
*/

app.get("/", (req, res) => {

    res.json({

        success: true,

        project: "App Protection API",

        version: "2.0",

        database: "Connected",

    });

});

/*
==========================================
Health
==========================================
*/

app.get("/health", async (req, res) => {

    try {

        await pool.query("SELECT NOW()");

        res.json({

            success: true,

            database: "online",

        });

    } catch {

        res.status(500).json({

            success: false,

            database: "offline",

        });

    }

});

/*
==========================================
Admin Login
==========================================
*/

app.post("/admin/login", async (req, res) => {

    try {

        const {

            username,

            password

        } = req.body;

        if (!username || !password) {

            return res.status(400).json({

                success: false,

                message: "Username and Password Required"

            });

        }

        const admin = await pool.query(

            "SELECT * FROM admins WHERE username=$1",

            [username]

        );

        if (admin.rows.length === 0) {

            return res.status(401).json({

                success: false,

                message: "Invalid Username"

            });

        }

        const row = admin.rows[0];

        let passwordMatch = false;

        /*
        اگر Hash ہوگا
        */

        try {

            passwordMatch = await bcrypt.compare(

                password,

                row.password

            );

        } catch {

            /*
            اگر Plain Text ہوگا
            */

            passwordMatch = password === row.password;

        }

        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message: "Wrong Password"

            });

        }

        const token = jwt.sign(

            {

                id: row.id,

                username: row.username,

                role: row.role

            },

            JWT_SECRET,

            {

                expiresIn: "7d"

            }

        );

        res.json({

            success: true,

            token,

            admin: {

                id: row.id,

                username: row.username,

                role: row.role

            }

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});

/*
==========================================
Protected Test
==========================================
*/

app.get("/admin/profile", verifyToken, async (req, res) => {

    res.json({

        success: true,

        admin: req.admin

    });

});

/*
==========================================
Start Server
==========================================
*/

app.listen(PORT, () => {

    console.log("Server Running On Port " + PORT);

});
/*
==========================================
Add New App
==========================================
*/

app.post("/admin/apps", verifyToken, async (req, res) => {

    try {

        const {
            app_name,
            package_name
        } = req.body;

        if (!app_name || !package_name) {

            return res.status(400).json({
                success: false,
                message: "App Name & Package Required"
            });

        }

        const apiKey =
            "APP_" +
            Math.random().toString(36).substring(2, 12).toUpperCase();

        const result = await pool.query(

            `INSERT INTO apps
            (app_name,package_name,api_key,status)
            VALUES($1,$2,$3,$4)
            RETURNING *`,

            [
                app_name,
                package_name,
                apiKey,
                true
            ]

        );

        res.json({

            success: true,

            message: "App Added",

            data: result.rows[0]

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


/*
==========================================
All Apps
==========================================
*/

app.get("/admin/apps", verifyToken, async (req, res) => {

    try {

        const apps = await pool.query(

            "SELECT * FROM apps ORDER BY id DESC"

        );

        res.json({

            success: true,

            total: apps.rows.length,

            data: apps.rows

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


/*
==========================================
Single App
==========================================
*/

app.get("/admin/apps/:id", verifyToken, async (req, res) => {

    try {

        const result = await pool.query(

            "SELECT * FROM apps WHERE id=$1",

            [req.params.id]

        );

        if (result.rows.length == 0) {

            return res.status(404).json({

                success: false,

                message: "App Not Found"

            });

        }

        res.json({

            success: true,

            data: result.rows[0]

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


/*
==========================================
Update App
==========================================
*/

app.put("/admin/apps/:id", verifyToken, async (req, res) => {

    try {

        const {

            app_name,

            package_name,

            status

        } = req.body;

        const result = await pool.query(

            `UPDATE apps
            SET app_name=$1,
            package_name=$2,
            status=$3
            WHERE id=$4
            RETURNING *`,

            [

                app_name,

                package_name,

                status,

                req.params.id

            ]

        );

        res.json({

            success: true,

            message: "Updated",

            data: result.rows[0]

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


/*
==========================================
Delete App
==========================================
*/

app.delete("/admin/apps/:id", verifyToken, async (req, res) => {

    try {

        await pool.query(

            "DELETE FROM apps WHERE id=$1",

            [req.params.id]

        );

        res.json({

            success: true,

            message: "Deleted"

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});


/*
==========================================
Pending Apps
==========================================
*/

app.get("/admin/pending", verifyToken, async (req, res) => {

    try {

        const result = await pool.query(

            "SELECT * FROM apps WHERE status=false ORDER BY id DESC"

        );

        res.json({

            success: true,

            total: result.rows.length,

            data: result.rows

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});
/*
==========================================
VERIFY DEVICE
==========================================
*/

app.post("/api/verify", async (req, res) => {

    try {

        const {

            api_key,

            package_name,

            android_id

        } = req.body;

        if (!api_key || !package_name || !android_id) {

            return res.status(400).json({

                success: false,

                message: "Missing Parameters"

            });

        }

        /*
        Check App
        */

        const appResult = await pool.query(

            `SELECT * FROM apps
             WHERE api_key=$1
             AND package_name=$2
             LIMIT 1`,

            [

                api_key,

                package_name

            ]

        );

        if (appResult.rows.length == 0) {

            return res.json({

                success: false,

                message: "Invalid App"

            });

        }

        const appData = appResult.rows[0];

        if (!appData.status) {

            return res.json({

                success: false,

                message: "App Disabled"

            });

        }

        /*
        Check Device
        */

        const deviceResult = await pool.query(

            `SELECT *
             FROM devices
             WHERE app_id=$1
             AND android_id=$2
             LIMIT 1`,

            [

                appData.id,

                android_id

            ]

        );

        /*
        New Device
        */

        if (deviceResult.rows.length == 0) {

            await pool.query(

                `INSERT INTO devices

                (
                    app_id,
                    android_id,
                    status
                )

                VALUES

                (
                    $1,
                    $2,
                    'pending'
                )`,

                [

                    appData.id,

                    android_id

                ]

            );

            return res.json({

                success: false,

                message: "Pending Approval"

            });

        }

        const device = deviceResult.rows[0];

        /*
        Blocked
        */

        if (device.status == "blocked") {

            return res.json({

                success: false,

                message: "Device Blocked"

            });

        }

        /*
        Pending
        */

        if (device.status == "pending") {

            return res.json({

                success: false,

                message: "Pending Approval"

            });

        }

        /*
        Expiry
        */

        if (device.expire_time != null) {

            const now = new Date();

            const expiry = new Date(device.expire_time);

            if (expiry < now) {

                return res.json({

                    success: false,

                    message: "Activation Expired"

                });

            }

        }

        /*
        Success
        */

        res.json({

            success: true,

            message: "Verification Successful",

            data: {

                device_id: device.id,

                app_name: appData.app_name,

                package_name: appData.package_name,

                android_id: device.android_id,

                status: device.status,

                expire_time: device.expire_time

            }

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});
