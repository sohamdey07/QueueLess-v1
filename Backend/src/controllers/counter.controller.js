import mongoose from 'mongoose';
import counterModel from '../models/counter.model.js';
import userModel from '../models/user.model.js';
import serviceModel from '../models/service.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { emitCounterUpdated } from '../services/queueSocket.service.js';

async function validateStaff(staffId) {
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
        return null;
    }

    const staff = await userModel.findOne({
        _id: staffId,
        role: "STAFF",
        isActive: true
    });

    return staff;
}

// Create counter
export async function addCounter(req, res, next) {
    try {
        const { name, code, assignedStaffId, serviceId } = req.body;

        const normalizedCode = code.trim().toUpperCase();

        const existingCounter = await counterModel.findOne({
            code: normalizedCode
        });

        if (existingCounter) {
            return errorResponse(res, {
                statusCode: 409,
                message: "Counter with this code already exists"
            });
        }

        if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Valid service ID is required"
            });
        }

        const service = await serviceModel.findById(serviceId);
        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        let resolvedStaffId = null;
        if (assignedStaffId) {
            const staff = await validateStaff(assignedStaffId);

            if (!staff) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Assigned staff must be an active staff member"
                });
            }

            const alreadyAssigned = await counterModel.findOne({
                assignedStaffId,
                isActive: true
            });

            if (alreadyAssigned) {
                return errorResponse(res, {
                    statusCode: 409,
                    message: "This staff member is already assigned to another active counter"
                });
            }

            resolvedStaffId = assignedStaffId;
        }

        const newCounter = await counterModel.create({
            name: name.trim(),
            code: normalizedCode,
            assignedStaffId: resolvedStaffId,
            serviceId
        });

        await newCounter.populate([
            { path: 'assignedStaffId', select: 'name email role' },
            { path: 'serviceId', select: 'name code' }
        ]);

        return successResponse(res, {
            statusCode: 201,
            message: "Counter created successfully",
            data: newCounter
        });
    } catch (error) {
        next(error);
    }
}

// Function to get all counters
export async function getAllCounters(req, res, next) {
    try {
        const counters = await counterModel.find()
            .populate('assignedStaffId', 'name email role')
            .populate('serviceId', 'name code')
            .sort({ createdAt: -1 });

        return successResponse(res, {
            statusCode: 200,
            message: counters.length === 0 ? "No counters found" : "Counters retrieved successfully",
            data: counters || []
        });
    } catch (error) {
        next(error);
    }
}

// Function to get active staff members available for counters
export async function getCounterStaff(req, res, next) {
    try {
        const staff = await userModel.find({
            role: "STAFF",
            isActive: true
        }).select("name email phone role isActive");

        return successResponse(res, {
            statusCode: 200,
            message: staff.length === 0 ? "No active staff members found" : "Staff retrieved successfully",
            data: staff || []
        });
    } catch (error) {
        next(error);
    }
}

// Function to get single counter by ID
export async function getCounterById(req, res, next) {
    try {
        const { counterId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(counterId)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Invalid counter ID"
            });
        }

        const counter = await counterModel.findById(counterId)
            .populate('assignedStaffId', 'name email role')
            .populate('serviceId', 'name code');

        if (!counter) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Counter not found"
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Counter retrieved successfully",
            data: counter
        });
    } catch (error) {
        next(error);
    }
}

// Function to update counter details
export async function updateCounter(req, res, next) {
    try {
        const { counterId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(counterId)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Invalid counter ID"
            });
        }

        let {
            name,
            code,
            serviceId,
            assignedStaffId,
            isActive
        } = req.body;

        // Security / Data Integrity: STAFF users are only permitted to toggle counter status (isActive)
        // and cannot reassign staff, change service, or modify counter names/codes.
        if (req.user?.role === "STAFF") {
            assignedStaffId = undefined;
            serviceId = undefined;
            name = undefined;
            code = undefined;
        }

        const counter = await counterModel.findById(counterId);

        if (!counter) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Counter not found"
            });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (code !== undefined) {
            const normalizedCode = code.trim().toUpperCase();

            const existingCounter = await counterModel.findOne({
                code: normalizedCode,
                _id: { $ne: counterId }
            });

            if (existingCounter) {
                return errorResponse(res, {
                    statusCode: 409,
                    message: "Counter with this code already exists"
                });
            }

            updateData.code = normalizedCode;
        }

        if (serviceId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Invalid service ID"
                });
            }

            const service = await serviceModel.findById(serviceId);
            if (!service) {
                return errorResponse(res, {
                    statusCode: 404,
                    message: "Service not found"
                });
            }

            updateData.serviceId = serviceId;
        }

        if (assignedStaffId !== undefined) {
            if (!assignedStaffId || assignedStaffId === null) {
                updateData.assignedStaffId = null;
            } else {
                const staff = await validateStaff(assignedStaffId);

                if (!staff) {
                    return errorResponse(res, {
                        statusCode: 400,
                        message: "Assigned staff must be an active staff member"
                    });
                }

                const alreadyAssigned = await counterModel.findOne({
                    assignedStaffId,
                    isActive: true,
                    _id: { $ne: counterId }
                });

                if (alreadyAssigned) {
                    return errorResponse(res, {
                        statusCode: 409,
                        message: "This staff member is already assigned to another active counter"
                    });
                }

                updateData.assignedStaffId = assignedStaffId;
            }
        }

        if (isActive !== undefined) {
            const nextActive = Boolean(isActive);
            updateData.isActive = nextActive;

            // If activating, verify that the assigned staff is not active elsewhere
            if (nextActive) {
                const targetStaffId = updateData.assignedStaffId !== undefined
                    ? updateData.assignedStaffId
                    : counter.assignedStaffId;

                if (targetStaffId) {
                    const alreadyAssigned = await counterModel.findOne({
                        assignedStaffId: targetStaffId,
                        isActive: true,
                        _id: { $ne: counterId }
                    });

                    if (alreadyAssigned) {
                        return errorResponse(res, {
                            statusCode: 409,
                            message: "Cannot activate counter: Assigned staff member is already active on another counter"
                        });
                    }
                }
            }
        }

        const updatedCounter = await counterModel.findByIdAndUpdate(
            counterId,
            updateData,
            {
                returnDocument: "after",
                runValidators: true
            }
        ).populate([
            { path: 'assignedStaffId', select: 'name email role' },
            { path: 'serviceId', select: 'name code' }
        ]);

        emitCounterUpdated(counterId, {
            isActive: updatedCounter.isActive,
            name: updatedCounter.name,
            code: updatedCounter.code
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Counter updated successfully",
            data: updatedCounter
        });
    } catch (error) {
        next(error);
    }
}

// Function to delete counter
export async function deleteCounter(req, res, next) {
    try {
        const { counterId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(counterId)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Invalid counter ID"
            });
        }

        // Check if counter exists
        const counter = await counterModel.findById(counterId);
        if (!counter) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Counter not found"
            });
        }

        // Delete counter
        const deletedCounter = await counterModel.findByIdAndDelete(counterId);

        return successResponse(res, {
            statusCode: 200,
            message: "Counter deleted successfully",
            data: deletedCounter
        });
    } catch (error) {
        next(error);
    }
}