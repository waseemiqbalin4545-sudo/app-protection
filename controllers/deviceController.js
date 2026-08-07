const db = require("../config/db");
const { calculateExpiry } = require("../utils/expiry");

/*
====================================
Pending Devices
====================================
*/

exports.getPendingDevices = async (req, res) => {

    try {

        const result = await db.query(

            `SELECT devices.*,apps.app_name
            FROM devices
            JOIN apps ON apps.id=devices.app_id
            WHERE devices.status='Pending'
            ORDER BY devices.id DESC`

        );

        res.json({

            success: true,

            total: result.rows.length,

            data: result.rows

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
====================================
Active Devices
====================================
*/

exports.getActiveDevices = async (req, res) => {

    try {

        const result = await db.query(

            `SELECT devices.*,apps.app_name
            FROM devices
            JOIN apps ON apps.id=devices.app_id
            WHERE devices.status='Active'
            ORDER BY devices.id DESC`

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

};


/*
====================================
Blocked Devices
====================================
*/

exports.getBlockedDevices = async (req, res) => {

    try {

        const result = await db.query(

            `SELECT devices.*,apps.app_name
            FROM devices
            JOIN apps ON apps.id=devices.app_id
            WHERE devices.status='Blocked'
            ORDER BY devices.id DESC`

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

};


/*
====================================
Activate Device
====================================
*/

exports.activateDevice = async (req, res) => {

    try {

        const {

            device_id,

            hours

        } = req.body;

        const expiry = calculateExpiry(hours);

        await db.query(

            `UPDATE devices
            SET
            status='Active',
            active_until=$1,
            approved_at=NOW(),
            approved_by=$2
            WHERE id=$3`,

            [

                expiry,

                req.user.id,

                device_id

            ]

        );

        res.json({

            success: true,

            message: "Device Activated"

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
====================================
Block Device
====================================
*/

exports.blockDevice = async (req, res) => {

    try {

        const {

            device_id

        } = req.body;

        await db.query(

            `UPDATE devices
            SET status='Blocked'
            WHERE id=$1`,

            [

                device_id

            ]

        );

        res.json({

            success: true,

            message: "Device Blocked"

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
====================================
Deactivate Device
====================================
*/

exports.deactivateDevice = async (req, res) => {

    try {

        const {

            device_id

        } = req.body;

        await db.query(

            `UPDATE devices
            SET status='Pending'
            WHERE id=$1`,

            [

                device_id

            ]

        );

        res.json({

            success: true,

            message: "Device Deactivated"

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};


/*
====================================
Delete Device
====================================
*/

exports.deleteDevice = async (req, res) => {

    try {

        await db.query(

            "DELETE FROM devices WHERE id=$1",

            [

                req.params.id

            ]

        );

        res.json({

            success: true,

            message: "Device Deleted"

        });

    } catch {

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
