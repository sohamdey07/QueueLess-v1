import express from "express";
import * as authFuntion from "../controllers/auth.controller.js";
import * as authRateLimit from "../middlewares/rateLimiting/authLimit.js";

const router = express.Router();

router.post("/register", authRateLimit.registerLimiter, authFuntion.registerUser);
router.post("/verify-account", authRateLimit.verifyAccountLimiter, authFuntion.verifyAccount);
router.post("/login", authRateLimit.loginLimiter, authFuntion.login);
router.post("/logout", authFuntion.logout);

export default router;