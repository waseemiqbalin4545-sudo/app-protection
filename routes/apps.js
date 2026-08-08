const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const appController = require("../controllers/appController");


// Add App
router.post("/add", auth, appController.addApp);


// All Apps
router.get("/all", auth, appController.getApps);


// Single App
router.get("/:id", auth, appController.getApp);


// Edit App
router.put("/:id", auth, appController.updateApp);


// ON / OFF
router.patch("/:id/status", auth, appController.updateStatus);


// Delete App
router.delete("/:id", auth, appController.deleteApp);


module.exports = router;
