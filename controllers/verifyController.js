const db = require("../config/db");
const { isExpired } = require("../utils/expiry");

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

        if (!api_key || !package_name || !android_id) {

            return res.json({
                success: false,
                message: "Missing Parameters"
            });

        }

        /*
        ===============================
        Check App
        ===============================
        */

        const appResult = await db.query(

            `SELECT * FROM apps
            WHERE api_key=$1
            AND package_name=$2
            LIMIT 1`,

            [api_key, package_name]

        );

        if (appResult.rows.length === 0) {

            return res.json({
                success: false,
                message: "Invalid App"
            });

        }

        const app = appResult.rows[0];

        if (!app.status) {

            return res.json({
                success: false,
                message: "App Disabled"
            });

        }

        /*
        ===============================
        Check Device
        ===============================
        */

        const deviceResult = await db.query(

            `SELECT * FROM devices
            WHERE app_id=$1
            AND android_id=$2
            LIMIT 1`,

            [app.id, android_id]

        );

        /*
        ===============================
        New Device
        ===============================
        */

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
                    created_at
                )
                VALUES
                (
                    $1,$2,$3,$4,$5,'Pending',NOW()
                )`,

                [

                    app.id,

                    android_id,

                    device_model,

                    manufacturer,

                    android_version

                ]

            );

            return res.json({

                success: false,

                message: "Pending Approval"

            });

        }

        const device = deviceResult.rows[0];

        /*
        ===============================
        Blocked
        ===============================
        */

        if (device.status === "Blocked") {

            return res.json({

                success: false,

                message: "Device Blocked"

            });

        }

        /*
        ===============================
        Pending
        ===============================
        */

        if (device.status === "Pending") {

            return res.json({

                success: false,

                message: "Pending Approval"

            });

        }

        /*
        ===============================
        Expired
        ===============================
        */

        if (device.active_until) {

            if (isExpired(device.active_until)) {

                return res.json({

                    success: false,

                    message: "Activation Expired"

                });

            }

        }

        /*
        ===============================
        Heartbeat
        ===============================
        */

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

        /*
        ===============================
        Success
        ===============================
        */

        return res.json({

            success: true,

            message: "Verification Successful",

            data: {

                app_name: app.app_name,

                package_name: app.package_name,

                android_id: device.android_id,

                status: device.status,

                active_until: device.active_until,

                app_version: app_version

            }

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
