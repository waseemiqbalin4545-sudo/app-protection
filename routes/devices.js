const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const deviceController = require("../controllers/deviceController");

router.get("/pending", auth, deviceController.getPendingDevices);

router.get("/active", auth, deviceController.getActiveDevices);

router.get("/blocked", auth, deviceController.getBlockedDevices);

router.post("/activate", auth, deviceController.activateDevice);

router.post("/block", auth, deviceController.blockDevice);

router.post("/deactivate", auth, deviceController.deactivateDevice);

router.delete("/:id", auth, deviceController.deleteDevice);

module.exports = router;
