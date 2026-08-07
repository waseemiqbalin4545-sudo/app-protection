const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/login", authController.login);

module.exports = router;
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/login", authController.login);

// Temporary Test Route
router.get("/test", (req, res) => {
    req.body = {
        username: "admin",
        password: "admin123"
    };

    return authController.login(req, res);
});

module.exports = router;
