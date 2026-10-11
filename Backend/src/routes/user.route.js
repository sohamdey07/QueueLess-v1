import express from "express";
import * as userController from "../controllers/user.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    userReadLimiter,
    userUpdateLimiter,
    userDeleteLimiter
} from "../middlewares/rateLimiting/userLimit.js";

const router = express.Router();

// GET /api/v1/users - Admin only: list users by role/status/search
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    userReadLimiter,
    userController.getAllUsers
);

// GET /api/v1/users/:userId - Get single user details
router.get(
    "/:userId",
    authenticate,
    userReadLimiter,
    userController.getUserById
);

// PATCH /api/v1/users/:userId/status - Admin only: toggle active status
router.patch(
    "/:userId/status",
    authenticate,
    authorizeRoles("ADMIN"),
    userUpdateLimiter,
    userController.toggleUserStatus
);

// PATCH /api/v1/users/:userId - Update user (Admin, Customer self, Staff self)
router.patch(
    "/:userId",
    authenticate,
    userUpdateLimiter,
    userController.updateUser
);

// DELETE /api/v1/users/:userId - Delete user (Admin, Customer self)
router.delete(
    "/:userId",
    authenticate,
    userDeleteLimiter,
    userController.deleteUser
);

export default router;
