const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const verifyController = require("../controllers/verifyController");

// ============================================
// ANDROID APP VERIFICATION
// POST /api/verify
// ============================================

router.post("/", verifyController.verify);


// ============================================
// ADMIN VERIFICATION CODE SYSTEM
// ============================================

// Generate new verification code
// POST /api/verify/generate
router.post(
    "/generate",
    auth,
    verifyController.generateCode
);


// Get all verification codes
// GET /api/verify/all
router.get(
    "/all",
    auth,
    verifyController.getCodes
);


// Disable verification code
// POST /api/verify/disable/:id
router.post(
    "/disable/:id",
    auth,
    verifyController.disableCode
);


// Delete verification code
// DELETE /api/verify/:id
router.delete(
    "/:id",
    auth,
    verifyController.deleteCode
);


module.exports = router;
