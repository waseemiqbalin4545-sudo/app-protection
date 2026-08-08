const crypto = require("crypto");

const db = require("../config/db");
const { isExpired } = require("../utils/expiry");


// ======================================================
// ANDROID APP VERIFICATION
// POST /api/verify
// ======================================================

exports.verify = async (req, res) => {

    try {

        const {
            api_key,
            package_name,
            android_id,
            device_model,
            manufacturer,
            android_version,
            app_version
        } = req.body;


        // ----------------------------------------------
        // Required Parameters
        // ----------------------------------------------

        if (!api_key || !package_name || !android_id) {

            return res.json({
                success: false,
                message: "Missing Parameters"
            });

        }


        // ----------------------------------------------
        // Find App
        // ----------------------------------------------

        const appResult = await db.query(

            `SELECT *
             FROM apps
             WHERE api_key=$1
             AND package_name=$2
             LIMIT 1`,

            [
                api_key,
                package_name
            ]

        );


        if (appResult.rows.length === 0) {

            return res.json({
                success: false,
                message: "Invalid App"
            });

        }


        const app = appResult.rows[0];


        // ----------------------------------------------
        // App Status
        // ----------------------------------------------

        if (
            app.status === false ||
            app.status === "OFF" ||
            app.status === "Disabled"
        ) {

            return res.json({
                success: false,
                message: "App Disabled"
            });

        }


        // ----------------------------------------------
        // Find Device
        // ----------------------------------------------

        const deviceResult = await db.query(

            `SELECT *
             FROM devices
             WHERE app_id=$1
             AND android_id=$2
             LIMIT 1`,

            [
                app.id,
                android_id
            ]

        );


        // ----------------------------------------------
        // New Device
        // ----------------------------------------------

        if (deviceResult.rows.length === 0) {

            await db.query(

                `INSERT INTO devices
                (
                    app_id,
                    android_id,
                    device_model,
                    manufacturer,
                    android_version,
                    status,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    'Pending',
                    NOW(),
                    NOW()
                )`,

                [
                    app.id,
                    android_id,
                    device_model || null,
                    manufacturer || null,
                    android_version || null
                ]

            );


            return res.json({

                success: false,
                message: "Pending Approval"

            });

        }


        const device = deviceResult.rows[0];


        // ----------------------------------------------
        // Blocked Device
        // ----------------------------------------------

        if (device.status === "Blocked") {

            return res.json({

                success: false,
                message: "Device Blocked"

            });

        }


        // ----------------------------------------------
        // Pending Device
        // ----------------------------------------------

        if (device.status === "Pending") {

            return res.json({

                success: false,
                message: "Pending Approval"

            });

        }


        // ----------------------------------------------
        // Check Expiry
        // ----------------------------------------------

        if (device.active_until) {

            if (isExpired(device.active_until)) {

                return res.json({

                    success: false,
                    message: "Activation Expired"

                });

            }

        }


        // ----------------------------------------------
        // Heartbeat
        // ----------------------------------------------

        await db.query(

            `UPDATE devices
             SET
                 last_seen=NOW(),
                 updated_at=NOW()
             WHERE id=$1`,

            [
                device.id
            ]

        );


        // ----------------------------------------------
        // Success
        // ----------------------------------------------

        return res.json({

            success: true,

            message: "Verification Successful",

            data: {

                app_name: app.app_name,

                package_name: app.package_name,

                android_id: device.android_id,

                status: device.status,

                active_until: device.active_until,

                app_version: app_version || app.version

            }

        });


    } catch (err) {

        console.error("VERIFY ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message || "Server Error"

        });

    }

};



// ======================================================
// GENERATE VERIFICATION CODE
// POST /api/verify/generate
// ======================================================

exports.generateCode = async (req, res) => {

    try {

        const {
            app_id,
            code,
            expiry_hours
        } = req.body;


        // ----------------------------------------------
        // Validate App ID
        // ----------------------------------------------

        if (
            app_id === undefined ||
            app_id === null ||
            app_id === ""
        ) {

            return res.status(400).json({

                success: false,
                message: "App ID Required"

            });

        }


        const appId = Number(app_id);


        if (!Number.isInteger(appId) || appId <= 0) {

            return res.status(400).json({

                success: false,
                message: "Invalid App ID"

            });

        }


        // ----------------------------------------------
        // Validate Expiry
        // ----------------------------------------------

        const hours = Number(expiry_hours);


        if (
            !Number.isFinite(hours) ||
            hours <= 0
        ) {

            return res.status(400).json({

                success: false,
                message: "Valid Expiry Hours Required"

            });

        }


        // ----------------------------------------------
        // Find App
        // ----------------------------------------------

        const appResult = await db.query(

            `SELECT
                id,
                app_name,
                package_name,
                status
             FROM apps
             WHERE id=$1
             LIMIT 1`,

            [
                appId
            ]

        );


        if (appResult.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "App Not Found"

            });

        }


        const app = appResult.rows[0];


        // ----------------------------------------------
        // Generate Code
        // ----------------------------------------------

        let verificationCode;


        if (
            code &&
            String(code).trim() !== ""
        ) {

            verificationCode = String(code)
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "-");

        } else {

            const part1 = crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();

            const part2 = crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();

            verificationCode =
                `AP-${part1}-${part2}`;

        }


        // ----------------------------------------------
        // Check Duplicate
        // ----------------------------------------------

        const duplicate = await db.query(

            `SELECT id
             FROM verification_codes
             WHERE code=$1
             LIMIT 1`,

            [
                verificationCode
            ]

        );


        if (duplicate.rows.length > 0) {

            return res.status(409).json({

                success: false,
                message: "Code Already Exists"

            });

        }


        // ----------------------------------------------
        // Calculate Expiry
        // ----------------------------------------------

        const expiresAt = new Date(
            Date.now() + (hours * 60 * 60 * 1000)
        );


        // ----------------------------------------------
        // Insert Code
        // ----------------------------------------------

        const result = await db.query(

            `INSERT INTO verification_codes
            (
                app_id,
                code,
                expiry_hours,
                expires_at,
                status,
                created_at
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                NOW()
            )
            RETURNING *`,

            [
                appId,
                verificationCode,
                hours,
                expiresAt,
                "Active"
            ]

        );


        // ----------------------------------------------
        // Success
        // ----------------------------------------------

        return res.status(201).json({

            success: true,

            message: "Verification Code Generated",

            data: {

                ...result.rows[0],

                app_name: app.app_name,

                package_name: app.package_name

            }

        });


    } catch (err) {

        console.error(
            "GENERATE CODE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            // IMPORTANT:
            // Actual PostgreSQL error will be shown
            message: err.message || "Server Error"

        });

    }

};



// ======================================================
// GET ALL VERIFICATION CODES
// GET /api/verify/all
// ======================================================

exports.getCodes = async (req, res) => {

    try {

        const result = await db.query(

            `SELECT
                vc.id,
                vc.code,
                vc.expiry_hours,
                vc.expires_at,
                vc.status,
                vc.device_id,
                vc.created_at,
                vc.used_at,

                a.app_name,
                a.package_name

             FROM verification_codes vc

             LEFT JOIN apps a
             ON a.id = vc.app_id

             ORDER BY vc.id DESC`

        );


        const codes = result.rows.map((item) => {

            let status = item.status;


            if (
                status === "Active" &&
                item.expires_at &&
                isExpired(item.expires_at)
            ) {

                status = "Expired";

            }


            return {

                ...item,

                status

            };

        });


        return res.json({

            success: true,

            total: codes.length,

            data: codes

        });


    } catch (err) {

        console.error(
            "GET CODES ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message || "Server Error"

        });

    }

};



// ======================================================
// DISABLE VERIFICATION CODE
// POST /api/verify/disable/:id
// ======================================================

exports.disableCode = async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({

                success: false,
                message: "Invalid Code ID"

            });

        }


        const result = await db.query(

            `UPDATE verification_codes
             SET status='Disabled'
             WHERE id=$1
             RETURNING *`,

            [
                id
            ]

        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Code Not Found"

            });

        }


        return res.json({

            success: true,

            message: "Verification Code Disabled",

            data: result.rows[0]

        });


    } catch (err) {

        console.error(
            "DISABLE CODE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message || "Server Error"

        });

    }

};



// ======================================================
// DELETE VERIFICATION CODE
// DELETE /api/verify/:id
// ======================================================

exports.deleteCode = async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({

                success: false,
                message: "Invalid Code ID"

            });

        }


        const result = await db.query(

            `DELETE FROM verification_codes
             WHERE id=$1
             RETURNING id`,

            [
                id
            ]

        );


        if (result.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Code Not Found"

            });

        }


        return res.json({

            success: true,

            message: "Verification Code Deleted"

        });


    } catch (err) {

        console.error(
            "DELETE CODE ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message || "Server Error"

        });

    }

};
