import express from "express";
import multer from "multer";

import * as serviceFunction from "../controllers/service.controller.js";
import * as serviceRateLimit from "../middlewares/rateLimiting/serviceLimit.js";

import { validate } from "../middlewares/validate.middleware.js";
import authenticate from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createServiceSchema,
    updateServiceSchema
} from "../validations/service.validation.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/service OR /api/v1/service/create -- ADMIN ACCESS
const handleCreateService = [
    serviceRateLimit.createServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    upload.single("imageUrl"),
    validate(createServiceSchema),
    serviceFunction.createService
];

router.post("/", ...handleCreateService);
router.post("/create", ...handleCreateService);

// PATCH/PUT /api/v1/service/:serviceId OR /api/v1/service/update/:serviceId -- ADMIN ACCESS
const handleUpdateService = [
    serviceRateLimit.updateServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    upload.single("imageUrl"),
    validate(updateServiceSchema),
    serviceFunction.updateService
];

router.patch("/update/:serviceId", ...handleUpdateService);
router.patch("/:serviceId", ...handleUpdateService);
router.put("/:serviceId", ...handleUpdateService);

// DELETE /api/v1/service/:serviceId OR /api/v1/service/delete/:serviceId -- ADMIN ACCESS
const handleDeleteService = [
    serviceRateLimit.deleteServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    serviceFunction.deleteService
];

router.delete("/delete/:serviceId", ...handleDeleteService);
router.delete("/:serviceId", ...handleDeleteService);

// GET /api/v1/service OR /api/v1/service/all -- ACCESS FOR ALL AUTHENTICATED USERS
router.get("/",
    serviceRateLimit.getAllServiceLimiter,
    authenticate,
    serviceFunction.getAllServices
);

router.get("/all",
    serviceRateLimit.getAllServiceLimiter,
    authenticate,
    serviceFunction.getAllServices
);

// GET /api/v1/service/:serviceId -- ACCESS FOR ALL AUTHENTICATED USERS
router.get("/:serviceId",
    serviceRateLimit.getServiceByIdLimiter,
    authenticate,
    serviceFunction.getServiceById
);

export default router;
