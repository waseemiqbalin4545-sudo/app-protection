const db = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

function generateRandomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let part1 = "";
    let part2 = "";

    for (let i = 0; i < 6; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    for (let i = 0; i < 6; i++) {
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `AP-${part1}-${part2}`;
}


// =====================================================
// ANDROID APP VERIFICATION
// POST /api/verify
// =====================================================

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


        // -------------------------------------------------
        // Validate parameters
        // -------------------------------------------------

        if (!api_key || !package_name || !android_id) {

            return res.status(400).json({
                success: false,
                message: "Missing Parameters"
            });

        }


        // -------------------------------------------------
        // Check App
        // -------------------------------------------------

        const appResult = await db.query(
            `
            SELECT *
            FROM apps
            WHERE api_key = $1
            AND package_name = $2
            LIMIT 1
            `,
            [
                api_key,
                package_name
            ]
        );


        if (appResult.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid App"
            });

        }


        const app = appResult.rows[0];


        // -------------------------------------------------
        // Check App Status
        // -------------------------------------------------

        if (
            app.status === false ||
            app.status === "OFF" ||
            app.status === "Disabled" ||
            app.status === "disabled"
        ) {

            return res.status(403).json({
                success: false,
                message: "App Disabled"
            });

        }


        // -------------------------------------------------
        // Check Device
        // -------------------------------------------------

        const deviceResult = await db.query(
            `
            SELECT *
            FROM devices
            WHERE app_id = $1
            AND android_id = $2
            LIMIT 1
            `,
            [
                app.id,
                android_id
            ]
        );


        // -------------------------------------------------
        // New Device
        // -------------------------------------------------

        if (deviceResult.rows.length === 0) {

            await db.query(
                `
                INSERT INTO devices
                (
                    app_id,
                    android_id,
                    device_model,
                    manufacturer,
                    android_version,
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
                    'Pending',
                    NOW()
                )
                `,
                [
                    app.id,
                    android_id,
                    device_model || null,
                    manufacturer || null,
                    android_version || null
                ]
            );


            return res.status(403).json({
                success: false,
                message: "Pending Approval"
            });

        }


        const device = deviceResult.rows[0];


        // -------------------------------------------------
        // Blocked Device
        // -------------------------------------------------

        if (
            device.status === "Blocked" ||
            device.status === "blocked"
        ) {

            return res.status(403).json({
                success: false,
                message: "Device Blocked"
            });

        }


        // -------------------------------------------------
        // Pending Device
        // -------------------------------------------------

        if (
            device.status === "Pending" ||
            device.status === "pending"
        ) {

            return res.status(403).json({
                success: false,
                message: "Pending Approval"
            });

        }


        // -------------------------------------------------
        // Check Activation Expiry
        // -------------------------------------------------

        if (device.active_until) {

            const expiryTime = new Date(device.active_until);
            const now = new Date();

            if (expiryTime <= now) {

                return res.status(403).json({
                    success: false,
                    message: "Activation Expired",
                    active_until: device.active_until
                });

            }

        }


        // -------------------------------------------------
        // Update Device Heartbeat
        // -------------------------------------------------

        await db.query(
            `
            UPDATE devices
            SET
                last_seen = NOW(),
                updated_at = NOW()
            WHERE id = $1
            `,
            [
                device.id
            ]
        );


        // -------------------------------------------------
        // Verification Successful
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message: "Verification Successful",

            data: {

                app_name: app.app_name,

                package_name: app.package_name,

                android_id: device.android_id,

                status: device.status,

                active_until: device.active_until,

                app_version: app_version || null

            }

        });


    } catch (error) {

        console.error("VERIFY ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// =====================================================
// GENERATE VERIFICATION CODE
// POST /api/verify/generate
// =====================================================

exports.generateCode = async (req, res) => {

    try {

        const {
            app_id,
            code,
            expiry_hours
        } = req.body;


        // -------------------------------------------------
        // Validate App
        // -------------------------------------------------

        if (!app_id) {

            return res.status(400).json({
                success: false,
                message: "App ID Required"
            });

        }


        // -------------------------------------------------
        // Validate Expiry
        // -------------------------------------------------

        const hours = Number(expiry_hours);

        if (!Number.isFinite(hours) || hours <= 0) {

            return res.status(400).json({
                success: false,
                message: "Valid expiry hours required"
            });

        }


        // -------------------------------------------------
        // Check App Exists
        // -------------------------------------------------

        const appResult = await db.query(
            `
            SELECT *
            FROM apps
            WHERE id = $1
            LIMIT 1
            `,
            [
                app_id
            ]
        );


        if (appResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "App Not Found"
            });

        }


        // -------------------------------------------------
        // Generate / Custom Code
        // -------------------------------------------------

        let verificationCode;

        if (code && String(code).trim() !== "") {

            verificationCode = String(code).trim();

        } else {

            verificationCode = generateRandomCode();

        }


        // -------------------------------------------------
        // Check Duplicate Code
        // -------------------------------------------------

        const duplicate = await db.query(
            `
            SELECT id
            FROM verification_codes
            WHERE code = $1
            LIMIT 1
            `,
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


        // -------------------------------------------------
        // Create Expiry
        // -------------------------------------------------

        const expiresAt = new Date(
            Date.now() + (hours * 60 * 60 * 1000)
        );


        // -------------------------------------------------
        // Insert Code
        // -------------------------------------------------

        const result = await db.query(
            `
            INSERT INTO verification_codes
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
                'Active',
                NOW()
            )
            RETURNING *
            `,
            [
                app_id,
                verificationCode,
                hours,
                expiresAt
            ]
        );


        return res.status(201).json({

            success: true,

            message: "Verification Code Generated",

            data: result.rows[0]

        });


    } catch (error) {

        console.error("GENERATE CODE ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// =====================================================
// GET ALL VERIFICATION CODES
// GET /api/verify/all
// =====================================================

exports.getCodes = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT
                vc.id,
                vc.code,
                vc.app_id,
                a.app_name,
                a.package_name,
                vc.expiry_hours,
                vc.expires_at,
                vc.status,
                vc.device_id,
                vc.created_at,
                vc.used_at
            FROM verification_codes vc

            LEFT JOIN apps a
                ON a.id = vc.app_id

            ORDER BY vc.id DESC
            `
        );


        return res.status(200).json({

            success: true,

            data: result.rows

        });


    } catch (error) {

        console.error("GET CODES ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// =====================================================
// DISABLE VERIFICATION CODE
// POST /api/verify/disable/:id
// =====================================================

exports.disableCode = async (req, res) => {

    try {

        const { id } = req.params;


        if (!id) {

            return res.status(400).json({
                success: false,
                message: "Code ID Required"
            });

        }


        const result = await db.query(
            `
            UPDATE verification_codes
            SET status = 'Disabled'
            WHERE id = $1
            RETURNING *
            `,
            [
                id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Verification Code Not Found"
            });

        }


        return res.status(200).json({

            success: true,

            message: "Verification Code Disabled",

            data: result.rows[0]

        });


    } catch (error) {

        console.error("DISABLE CODE ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


// =====================================================
// DELETE VERIFICATION CODE
// DELETE /api/verify/:id
// =====================================================

exports.deleteCode = async (req, res) => {

    try {

        const { id } = req.params;


        if (!id) {

            return res.status(400).json({
                success: false,
                message: "Code ID Required"
            });

        }


        const result = await db.query(
            `
            DELETE FROM verification_codes
            WHERE id = $1
            RETURNING *
            `,
            [
                id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Verification Code Not Found"
            });

        }


        return res.status(200).json({

            success: true,

            message: "Verification Code Deleted"

        });


    } catch (error) {

        console.error("DELETE CODE ERROR:", error);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
