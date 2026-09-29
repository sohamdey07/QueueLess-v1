import express from "express";
import * as authFuntion from "../controllers/auth.controller.js";
import * as authRateLimit from "../middlewares/rateLimiting/authLimit.js";
import {validate} from "../middlewares/validate.middleware.js";
import {registerSchema, loginSchema, verifyAccountSchema} from "../validations/auth.validation.js";

const router = express.Router();


// POST /api/v1/auth/register
router.post(
    "/register", 
    validate(registerSchema),
    authRateLimit.registerLimiter,
    authFuntion.registerUser
);

// POST /api/v1/auth/verify-account
router.post(
    "/verify-account", 
    validate(verifyAccountSchema), 
    authRateLimit.verifyAccountLimiter, 
    authFuntion.verifyAccount
);

// POST /api/v1/auth/login
router.post(
    "/login", 
    validate(loginSchema), 
    authRateLimit.loginLimiter, 
    authFuntion.login
);

// POST /api/v1/auth/rotate-token
router.post(
    "/rotate-token",
    authRateLimit.rotateTokenLimiter,
    authFuntion.rotateToken
);


// POST /api/v1/auth/logout
router.post(
    "/logout", 
    authFuntion.logout
);

export default router;