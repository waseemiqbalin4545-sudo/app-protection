const express = require("express");

const router = express.Router();

const auth =
    require("../middleware/auth");

const verificationController =
    require("../controllers/verificationController");


/*
========================================
All Codes
========================================
*/

router.get(
    "/all",
    auth,
    verificationController.getCodes
);


/*
========================================
Generate Code
========================================
*/

router.post(
    "/generate",
    auth,
    verificationController.generateCode
);


/*
========================================
Delete Code
========================================
*/

router.delete(
    "/:id",
    auth,
    verificationController.deleteCode
);


module.exports = router;
