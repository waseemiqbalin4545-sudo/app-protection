const db = require("../config/db");
const crypto = require("crypto");

/*
========================================
Generate Random Code
========================================
*/

function generateCode() {
    return crypto
        .randomBytes(5)
        .toString("hex")
        .toUpperCase();
}


/*
========================================
All Verification Codes
========================================
*/

exports.getCodes = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                verification_codes.*,
                apps.app_name
            FROM verification_codes
            LEFT JOIN apps
                ON apps.id = verification_codes.app_id
            ORDER BY verification_codes.id DESC
        `);

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
========================================
Generate Verification Code
========================================
*/

exports.generateCode = async (req, res) => {

    try {

        const {
            app_id,
            hours,
            type,
            code
        } = req.body;


        if (!app_id) {

            return res.json({

                success: false,

                message: "App Required"

            });

        }


        if (!hours || Number(hours) <= 0) {

            return res.json({

                success: false,

                message: "Valid Expiry Hours Required"

            });

        }


        /*
        Check App
        */

        const appResult = await db.query(
            "SELECT id,app_name FROM apps WHERE id=$1",
            [app_id]
        );


        if (appResult.rows.length === 0) {

            return res.json({

                success: false,

                message: "App Not Found"

            });

        }


        /*
        Generate / Custom Code
        */

        let verificationCode;


        if (type === "custom") {

            if (!code || !code.trim()) {

                return res.json({

                    success: false,

                    message: "Custom Code Required"

                });

            }

            verificationCode =
                code.trim();

        } else {

            verificationCode =
                generateCode();

        }


        /*
        Check duplicate
        */

        const existing =
            await db.query(
                `SELECT id
                 FROM verification_codes
                 WHERE code=$1`,
                [verificationCode]
            );


        if (existing.rows.length > 0) {

            return res.json({

                success: false,

                message: "Code Already Exists"

            });

        }


        /*
        Create expiry
        */

        const result =
            await db.query(
                `INSERT INTO verification_codes
                (
                    app_id,
                    code,
                    status,
                    expires_at,
                    created_at
                )
                VALUES
                (
                    $1,
                    $2,
                    'Active',
                    NOW() + ($3 * INTERVAL '1 hour'),
                    NOW()
                )
                RETURNING *`,
                [
                    app_id,
                    verificationCode,
                    Number(hours)
                ]
            );


        res.json({

            success: true,

            message: "Verification Code Generated",

            data: result.rows[0]

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
========================================
Delete Verification Code
========================================
*/

exports.deleteCode = async (req, res) => {

    try {

        const result =
            await db.query(
                `DELETE FROM verification_codes
                 WHERE id=$1
                 RETURNING id`,
                [req.params.id]
            );


        if (result.rows.length === 0) {

            return res.json({

                success: false,

                message: "Code Not Found"

            });

        }


        res.json({

            success: true,

            message: "Verification Code Deleted"

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
