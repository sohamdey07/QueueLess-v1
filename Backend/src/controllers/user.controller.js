import userModel from "../models/user.model.js";
import counterModel from "../models/counter.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// GET /api/v1/users - List users with optional role, status, and search filters (Admin only)
export async function getAllUsers(req, res, next) {
    try {
        const { role, status, search } = req.query;
        const query = {};

        if (role) {
            query.role = role.toUpperCase();
        }

        if (status && status !== 'all') {
            query.isActive = status.toLowerCase() === 'active';
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { email: regex },
                { phone: regex }
            ];
        }

        const users = await userModel.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        return successResponse(res, {
            statusCode: 200,
            message: "Users retrieved successfully",
            data: users || []
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/v1/users/:userId - Get single user details
export async function getUserById(req, res, next) {
    try {
        const { userId } = req.params;
        const targetUserId = (userId === "me" || userId === "current") ? req.user.id : userId;
        const user = await userModel.findById(targetUserId).select("-password");

        if (!user) {
            return errorResponse(res, {
                statusCode: 404,
                message: "User not found"
            });
        }

        // Only Admin or the user themselves can view their details
        if (req.user.role !== "ADMIN" && req.user.id !== user._id.toString()) {
            return errorResponse(res, {
                statusCode: 403,
                message: "Unauthorized to view this user profile"
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "User retrieved successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/v1/users/:userId - Update user profile
export async function updateUser(req, res, next) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;
        const targetUserId = (userId === "me" || userId === "current") ? currentUserId : userId;

        const user = await userModel.findById(targetUserId);
        if (!user) {
            return errorResponse(res, {
                statusCode: 404,
                message: "User not found"
            });
        }

        const isSelf = currentUserId === user._id.toString();
        const isAdmin = currentUserRole === "ADMIN";

        // Admin has full control over all users
        if (isAdmin && !isSelf) {
            const { name, email, phone, isActive, password } = req.body;

            if (name !== undefined && name.trim()) {
                user.name = name.trim();
            }

            if (phone !== undefined) {
                user.phone = phone.trim();
            }

            if (isActive !== undefined) {
                user.isActive = Boolean(isActive);
            }

            if (email !== undefined && email.trim()) {
                const normalizedEmail = email.trim().toLowerCase();
                if (normalizedEmail !== user.email) {
                    const existing = await userModel.findOne({
                        email: normalizedEmail,
                        _id: { $ne: user._id }
                    });
                    if (existing) {
                        return errorResponse(res, {
                            statusCode: 409,
                            message: "Email address is already in use by another account"
                        });
                    }
                    user.email = normalizedEmail;
                }
            }

            if (password && password.trim().length >= 6) {
                const newPass = password.trim();
                const isSame = await comparePassword(newPass, user.password);
                if (isSame) {
                    return errorResponse(res, {
                        statusCode: 400,
                        message: "Both passwords are the same, cannot change/modify."
                    });
                }
                user.password = await hashPassword(newPass);
            }

            await user.save();

            const sanitized = user.toObject();
            delete sanitized.password;

            return successResponse(res, {
                statusCode: 200,
                message: "User updated successfully",
                data: sanitized
            });
        }

        // Self-update for Staff, Customer, and Admin self:
        // Users can update their name and phone number only; email address cannot be changed.
        // Users can also update their password in the Settings popup.
        if (isSelf) {
            const { name, phone, currentPassword, password } = req.body;

            if (name !== undefined && name.trim()) {
                user.name = name.trim();
            }

            if (phone !== undefined) {
                user.phone = phone.trim();
            }

            if (password !== undefined && String(password).trim()) {
                const newPass = String(password).trim();
                if (newPass.length < 6) {
                    return errorResponse(res, {
                        statusCode: 400,
                        message: "Password must be at least 6 characters long"
                    });
                }

                // If currentPassword is provided, verify it against existing user.password
                if (currentPassword) {
                    const isCurrentValid = await comparePassword(String(currentPassword).trim(), user.password);
                    if (!isCurrentValid) {
                        return errorResponse(res, {
                            statusCode: 400,
                            message: "Current password is incorrect. Please verify."
                        });
                    }
                }

                // Check if new password is identical to the current password
                const isSamePassword = await comparePassword(newPass, user.password);
                if (isSamePassword) {
                    return errorResponse(res, {
                        statusCode: 400,
                        message: "Both passwords are the same, cannot change/modify."
                    });
                }

                user.password = await hashPassword(newPass);
            }

            await user.save();

            const sanitized = user.toObject();
            delete sanitized.password;

            return successResponse(res, {
                statusCode: 200,
                message: "Profile updated successfully",
                data: sanitized
            });
        }

        return errorResponse(res, {
            statusCode: 403,
            message: "Unauthorized to update this user account"
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/v1/users/:userId/status - Toggle active/inactive status (Admin only)
export async function toggleUserStatus(req, res, next) {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return errorResponse(res, {
                statusCode: 404,
                message: "User not found"
            });
        }

        // Prevent admin from deactivating their own account
        if (req.user.id === user._id.toString() && isActive === false) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Administrator cannot deactivate their own account"
            });
        }

        user.isActive = isActive !== undefined ? Boolean(isActive) : !user.isActive;
        await user.save();

        const sanitized = user.toObject();
        delete sanitized.password;

        return successResponse(res, {
            statusCode: 200,
            message: `User account ${user.isActive ? "activated" : "deactivated"} successfully`,
            data: sanitized
        });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/v1/users/:userId - Delete user account (Admin or Customer self-delete)
export async function deleteUser(req, res, next) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        const user = await userModel.findById(userId);
        if (!user) {
            return errorResponse(res, {
                statusCode: 404,
                message: "User not found"
            });
        }

        const isSelf = currentUserId === user._id.toString();
        const isAdmin = currentUserRole === "ADMIN";

        // Admin can delete any user; Customer can delete their own account; Staff cannot delete accounts
        if (!isAdmin && !(isSelf && currentUserRole === "CUSTOMER")) {
            return errorResponse(res, {
                statusCode: 403,
                message: "Unauthorized: only administrators can delete user accounts"
            });
        }

        // Admin cannot delete their own account
        if (isSelf && isAdmin) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Administrator cannot delete their own account"
            });
        }

        // If user is STAFF, unassign them from any active counters
        if (user.role === "STAFF") {
            await counterModel.updateMany(
                { assignedStaffId: user._id },
                { $set: { assignedStaffId: null } }
            );
        }

        await userModel.findByIdAndDelete(userId);

        return successResponse(res, {
            statusCode: 200,
            message: `${user.role === "STAFF" ? "Staff member" : "User"} deleted successfully`
        });
    } catch (error) {
        next(error);
    }
}
