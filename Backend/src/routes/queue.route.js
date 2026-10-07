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

export default router;