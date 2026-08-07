const db = require("../config/db");

/*
====================================
Dashboard
====================================
*/

exports.dashboard = async (req, res) => {

    try {

        const totalApps = await db.query(
            "SELECT COUNT(*) FROM apps"
        );

        const totalDevices = await db.query(
            "SELECT COUNT(*) FROM devices"
        );

        const pendingDevices = await db.query(
            "SELECT COUNT(*) FROM devices WHERE status='Pending'"
        );

        const activeDevices = await db.query(
            "SELECT COUNT(*) FROM devices WHERE status='Active'"
        );

        const blockedDevices = await db.query(
            "SELECT COUNT(*) FROM devices WHERE status='Blocked'"
        );

        const expiredDevices = await db.query(
            `SELECT COUNT(*)
             FROM devices
             WHERE status='Active'
             AND active_until < NOW()`
        );

        const onlineDevices = await db.query(
            `SELECT COUNT(*)
             FROM devices
             WHERE last_seen > NOW() - INTERVAL '5 minutes'`
        );

        res.json({

            success: true,

            data: {

                total_apps:
                    Number(totalApps.rows[0].count),

                total_devices:
                    Number(totalDevices.rows[0].count),

                pending_devices:
                    Number(pendingDevices.rows[0].count),

                active_devices:
                    Number(activeDevices.rows[0].count),

                blocked_devices:
                    Number(blockedDevices.rows[0].count),

                expired_devices:
                    Number(expiredDevices.rows[0].count),

                online_devices:
                    Number(onlineDevices.rows[0].count)

            }

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Dashboard Error"

        });

    }

};
