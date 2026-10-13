import express from "express";
import * as queueFunction from "../controllers/queue.controller.js";
import {queueParamsSchema,queueEntryParamsSchema} from "../validations/queue.validation.js";
import {validate} from "../middlewares/validate.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import authenticate from "../middlewares/auth.middleware.js";
import { staffQueueLimiter } from "../middlewares/rateLimiting/staffQueueLimit.js";


const router = express.Router();



//POST /api/v1/queue/:queueId/call-next
router.post(
    "/:queueId/call-next",
    authenticate,
    staffQueueLimiter,
    authorizeRoles("ADMIN", "STAFF"),
    validate(queueParamsSchema, "params"),
    queueFunction.callNextCustomer
);


//POST /api/v1/queue/:queueEntryId/skip
router.post(
    "/:queueEntryId/skip",
    authenticate,
    staffQueueLimiter,
    authorizeRoles("ADMIN", "STAFF"),
    validate(queueEntryParamsSchema, "params"),
    queueFunction.skipQueueEntry
);


//POST /api/v1/queue/:queueEntryId/start
router.post(
    "/:queueEntryId/start",
    authenticate,
    staffQueueLimiter,
    authorizeRoles("ADMIN", "STAFF"),
    validate(queueEntryParamsSchema, "params"),
    queueFunction.startQueueService
);

//POST /api/v1/queue/:queueEntryId/complete
router.post(
    "/:queueEntryId/complete",
    authenticate,
    staffQueueLimiter,
    authorizeRoles("ADMIN", "STAFF"),
    validate(queueEntryParamsSchema, "params"),
    queueFunction.completeQueueService
);

//GET /api/v1/queue/tv-display
router.get(
    "/tv-display",
    queueFunction.getTvDisplayOverview
);

//GET /api/v1/queue/staff-overview
router.get(
    "/staff-overview",
    authenticate,
    authorizeRoles("ADMIN", "STAFF"),
    queueFunction.getStaffQueueOverview
);

//GET /api/v1/queue/logs
router.get(
    "/logs",
    authenticate,
    authorizeRoles("ADMIN"),
    queueFunction.getQueueLogs
);

//GET /api/v1/queue/trends
router.get(
    "/trends",
    authenticate,
    authorizeRoles("ADMIN", "STAFF"),
    queueFunction.getQueueTrends
);

//GET /api/v1/queue/recent-activities
router.get(
    "/recent-activities",
    authenticate,
    authorizeRoles("ADMIN", "STAFF"),
    queueFunction.getRecentActivities
);

//GET /api/v1/queue/:queueId
router.get(
    "/:queueId",
    authenticate,
    authorizeRoles("CUSTOMER"),
    validate(queueParamsSchema, "params"),
    queueFunction.getQueueStatus
);


export default router;