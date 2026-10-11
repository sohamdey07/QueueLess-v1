import express from "express";
import * as availabilityLimiter from "../middlewares/rateLimiting/availabilityLimit.js";
import * as availabilityFunction from "../controllers/availability.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import authenticate from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    createAvailabilitySchema,
    updateAvailabilitySchema,
    availabilityParamsSchema,
    serviceAvailabilityParamsSchema
} from "../validations/availability.validation.js";

const router = express.Router();

// GET /api/v1/availability/all -- ALL ROLES ACCESS
router.get(
    "/all",
    availabilityLimiter.getAvailabilityLimiter,
    availabilityFunction.getAllAvailabilities
);

// GET /api/v1/availability -- ALL ROLES ACCESS
router.get(
    "/",
    availabilityLimiter.getAvailabilityLimiter,
    availabilityFunction.getAllAvailabilities
);

// POST /api/v1/availability/create -- ADMIN ACCESS
router.post(
    "/create",
    availabilityLimiter.createAvailabilityLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(createAvailabilitySchema, "body"),
    availabilityFunction.createAvailability
);

// POST /api/v1/availability -- ADMIN ACCESS
router.post(
    "/",
    availabilityLimiter.createAvailabilityLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(createAvailabilitySchema, "body"),
    availabilityFunction.createAvailability
);

// POST /api/v1/availability/:serviceId -- ADMIN ACCESS
router.post(
    "/:serviceId",
    availabilityLimiter.createAvailabilityLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(serviceAvailabilityParamsSchema, "params"),
    validate(createAvailabilitySchema, "body"),
    availabilityFunction.createAvailability
);

// PATCH /api/v1/availability/:availabilityId -- ADMIN ACCESS
router.patch(
    "/:availabilityId",
    availabilityLimiter.updateAvailabilityLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(availabilityParamsSchema, "params"),
    validate(updateAvailabilitySchema, "body"),
    availabilityFunction.updateAvailability
);

// DELETE /api/v1/availability/:availabilityId -- ADMIN ACCESS
router.delete(
    "/:availabilityId",
    availabilityLimiter.deleteAvailabilityLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    validate(availabilityParamsSchema, "params"),
    availabilityFunction.deleteAvailability
);

// GET /api/v1/availability/:serviceId -- ALL ROLES ACCESS
router.get(
    "/:serviceId",
    availabilityLimiter.getAvailabilityLimiter,
    validate(serviceAvailabilityParamsSchema, "params"),
    availabilityFunction.getAvailability
);

export default router;
