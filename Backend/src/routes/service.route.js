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
const upload = multer({storage: multer.memoryStorage()}); // Use memory storage for multer

//POST /api/v1/service/create  -- ADMIN ACCESS
router.post("/create",
    serviceRateLimit.createServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    upload.single("imageUrl"),
    validate(createServiceSchema),
    serviceFunction.createService
);

//PATCH /api/v1/service/update/:serviceId  -- ADMIN ACCESS
router.patch("/update/:serviceId",
    serviceRateLimit.updateServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    upload.single("imageUrl"),
    validate(updateServiceSchema),
    serviceFunction.updateService
);

//DELETE /api/v1/service/delete/:serviceId -- ADMIN ACCESS
router.delete("/delete/:serviceId",
    serviceRateLimit.deleteServiceLimiter,
    authenticate,
    authorizeRoles("ADMIN"),
    serviceFunction.deleteService
);

//GET /api/v1/service/all  -- ACCESS FOR ALL ROLES
router.get("/all",
    serviceRateLimit.getAllServiceLimiter,
    authenticate,
    serviceFunction.getAllServices
);

//GET /api/v1/service/:serviceId  -- ACCESS FOR ALL ROLES
router.get("/:serviceId",
    serviceRateLimit.getServiceByIdLimiter,
    authenticate,
    serviceFunction.getServiceById
);

export default router;


