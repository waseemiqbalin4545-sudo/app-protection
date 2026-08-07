const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const appController = require("../controllers/appController");

router.post("/add", auth, appController.addApp);

router.get("/all", auth, appController.getApps);

router.get("/:id", auth, appController.getApp);

router.delete("/:id", auth, appController.deleteApp);

module.exports = router;
