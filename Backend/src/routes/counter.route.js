import express from "express";
import {authorizeRoles} from "../middlewares/role.middleware.js";
import authenticate from "../middlewares/auth.middleware.js";
import * as counterFunction from "../controllers/counter.controller.js";
import * as counterValidation from "../validations/counter.validation.js";
import {validate} from "../middlewares/validate.middleware.js";

import {
    counterCreateLimiter,
    counterReadLimiter,
    counterUpdateLimiter,
    counterDeleteLimiter
} from "../middlewares/rateLimiting/counterLimit.js";

const router = express.Router();



//POST   /api/v1/counters/add
router.post(
    "/add",
    counterCreateLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(counterValidation.createCounterSchema, "body"),
    counterFunction.addCounter
);


//GET    /api/v1/counters/
router.get(
    "/",
    counterReadLimiter,
    authenticate,
    authorizeRoles("ADMIN", "STAFF"),
    counterFunction.getAllCounters
);


//GET    /api/v1/counters/staff
router.get(
    "/staff",
    counterReadLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    counterFunction.getCounterStaff
);


//GET    /api/v1/counters/:counterId
router.get(
    "/:counterId",
    counterReadLimiter,
    authenticate,
    authorizeRoles("ADMIN", "STAFF"),
    validate(counterValidation.counterParamsSchema, "params"),
    counterFunction.getCounterById
);


//PATCH  /api/v1/counters/:counterId
router.patch(
    "/:counterId",
    counterUpdateLimiter,
    authenticate,
    authorizeRoles("ADMIN","STAFF"),
    validate(counterValidation.counterParamsSchema, "params"),
    validate(counterValidation.updateCounterSchema, "body"),
    counterFunction.updateCounter
);


//DELETE /api/v1/counters/:counterId
router.delete(
    "/:counterId",
    counterDeleteLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(counterValidation.counterParamsSchema, "params"),
    counterFunction.deleteCounter
);



export default router;