const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const appController =
    require("../controllers/appController");



/*
========================================
ADD
POST /api/apps/add
========================================
*/

router.post(
    "/add",
    auth,
    appController.addApp
);



/*
========================================
ALL
GET /api/apps/all
========================================
*/

router.get(
    "/all",
    auth,
    appController.getApps
);



/*
========================================
SINGLE
GET /api/apps/:id
========================================
*/

router.get(
    "/:id",
    auth,
    appController.getApp
);



/*
========================================
UPDATE
PUT /api/apps/:id
========================================
*/

router.put(
    "/:id",
    auth,
    appController.updateApp
);



/*
========================================
STATUS
PATCH /api/apps/:id/status
========================================
*/

router.patch(
    "/:id/status",
    auth,
    appController.updateStatus
);



/*
========================================
DELETE
DELETE /api/apps/:id
========================================
*/

router.delete(
    "/:id",
    auth,
    appController.deleteApp
);



module.exports = router;
