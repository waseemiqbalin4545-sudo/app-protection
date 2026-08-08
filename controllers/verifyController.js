const db = require("../config/db");
const { isExpired } = require("../utils/expiry");

// =====================================================
// ANDROID APP VERIFICATION
// POST /api/verify
// =====================================================

exports.verify = async (req, res) => {
    try {

        const {
            api_key,
            package_name,
            verification_code,
            android_id,
            device_model,
            manufacturer,
            android_version,
            app_version
        } = req.body;


        // =================================================
        // VALIDATE PARAMETERS
        // =================================================

        if (!api_key || !package_name || !verification_code || !android_id) {

            return res.status(400).json({
                success: false,
                message: "Missing Parameters"
            });

        }


        // =================================================
        // CHECK APP
        // =================================================

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


        // =================================================
        // CHECK APP STATUS
        // =================================================

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


        // =================================================
        // CHECK VERIFICATION CODE
        // =================================================

        const codeResult = await db.query(
            `
            SELECT *
            FROM verification_codes
            WHERE code = $1
            AND app_id = $2
            LIMIT 1
            `,
            [
                verification_code,
                app.id
            ]
        );


        if (codeResult.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid Verification Code"
            });

        }


        const code = codeResult.rows[0];


        // =================================================
        // CHECK CODE STATUS
        // =================================================

        if (
            code.status === "Disabled" ||
            code.status === "disabled" ||
            code.status === "Expired" ||
            code.status === "expired"
        ) {

            return res.status(403).json({
                success: false,
                message: "Verification Code Disabled"
            });

        }


        // =================================================
        // CHECK CODE EXPIRY
        // =================================================

        if (code.expires_at && isExpired(code.expires_at)) {

            // Mark expired
            await db.query(
                `
                UPDATE verification_codes
                SET status = 'Expired'
                WHERE id = $1
                `,
                [
                    code.id
                ]
            );


            return res.status(403).json({
                success: false,
                message: "Verification Code Expired"
            });

        }


        // =================================================
        // CHECK DEVICE
        // =================================================

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


        // =================================================
        // NEW DEVICE
        // =================================================

        if (deviceResult.rows.length === 0) {

            const newDevice = await db.query(
                `
                INSERT INTO devices
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
                )
                RETURNING id
                `,
                [
                    app.id,
                    android_id,
                    device_model || null,
                    manufacturer || null,
                    android_version || null
                ]
            );


            const newDeviceId = newDevice.rows[0].id;


            // Bind verification code to device
            await db.query(
                `
                UPDATE verification_codes
                SET
                    device_id = $1
                WHERE id = $2
                `,
                [
                    newDeviceId,
                    code.id
                ]
            );


            return res.json({
                success: false,
                message: "Pending Approval",
                data: {
                    device_id: newDeviceId,
                    status: "Pending"
                }
            });

        }


        const device = deviceResult.rows[0];


        // =================================================
        // BLOCKED DEVICE
        // =================================================

        if (
            device.status === "Blocked" ||
            device.status === "blocked"
        ) {

            return res.status(403).json({
                success: false,
                message: "Device Blocked"
            });

        }


        // =================================================
        // PENDING DEVICE
        // =================================================

        if (
            device.status === "Pending" ||
            device.status === "pending"
        ) {

            return res.json({
                success: false,
                message: "Pending Approval",
                data: {
                    device_id: device.id,
                    status: device.status
                }
            });

        }


        // =================================================
        // ACTIVE DEVICE EXPIRY
        // =================================================

        if (device.active_until) {

            if (isExpired(device.active_until)) {

                await db.query(
                    `
                    UPDATE devices
                    SET
                        status = 'Pending',
                        updated_at = NOW()
                    WHERE id = $1
                    `,
                    [
                        device.id
                    ]
                );


                return res.status(403).json({
                    success: false,
                    message: "Activation Expired"
                });

            }

        }


        // =================================================
        // VERIFY CODE DEVICE BINDING
        // =================================================

        if (
            code.device_id &&
            Number(code.device_id) !== Number(device.id)
        ) {

            return res.status(403).json({
                success: false,
                message: "Verification Code Already Used"
            });

        }


        // =================================================
        // UPDATE DEVICE HEARTBEAT
        // =================================================

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


        // =================================================
        // UPDATE CODE
        // =================================================

        await db.query(
            `
            UPDATE verification_codes
            SET
                device_id = $1,
                used_at = COALESCE(used_at, NOW())
            WHERE id = $2
            `,
            [
                device.id,
                code.id
            ]
        );


        // =================================================
        // SUCCESS
        // =================================================

        return res.json({

            success: true,

            message: "Verification Successful",

            data: {

                app_name: app.app_name,

                package_name: app.package_name,

                android_id: device.android_id,

                device_id: device.id,

                status: device.status,

                active_until: device.active_until,

                verification_code: code.code,

                app_version: app_version || null

            }

        });


    } catch (err) {

        console.error("VERIFY ERROR:", err);


        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }
};
