import counterModel from '../models/counter.model.js';
import userModel from '../models/user.model.js';
import { successResponse,errorResponse } from '../utils/apiResponse.js';


async function validateStaff(staffId) {
    const staff = await userModel.findOne({
        _id: staffId,
        role: "STAFF",
        isActive: true
    });

    return staff;
};

// Create counter
export async function addCounter(req, res, next) {
    try {
        const { name, code, assignedStaffId } = req.body;

        const normalizedCode = code.toUpperCase();

        const existingCounter = await counterModel.findOne({
            code: normalizedCode
        });

        if (existingCounter) {
            return errorResponse(res, {
                statusCode: 409,
                message: "Counter with this code already exists"
            });
        }

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
        }

        const newCounter = await counterModel.create({
            name,
            code: normalizedCode,
            assignedStaffId: assignedStaffId || null
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Counter created successfully",
            data: newCounter
        });
    } catch (error) {
        next(error);
    }
}

//function to get all counters
export async function getAllCounters(req, res, next) {
    try{
        const counters = await counterModel.find().populate('assignedStaffId', 'name email role');
        if (!counters || counters.length === 0) {
            return errorResponse(res,
            {
                statusCode: 404,
                message: "No counters found"
            })
        }
        
        return successResponse(res,
        {
            statusCode: 200,
            message: "Counters retrieved successfully",
            data: counters
        })
    }
    catch (error) {
        next(error);
    }
}

//function to update counter details
// Update counter
export async function updateCounter(req, res, next) {
    try {
        const { counterId } = req.params;
        const {
            name,
            code,
            assignedStaffId,
            isActive
        } = req.body;

        const counter = await counterModel.findById(counterId);

        if (!counter) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Counter not found"
            });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (code !== undefined) {
            const normalizedCode = code.toUpperCase();

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

        if (assignedStaffId !== undefined) {
            if (assignedStaffId === null) {
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
            updateData.isActive = isActive;
        }

        const updatedCounter = await counterModel.findByIdAndUpdate(
            counterId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        return successResponse(res, {
            statusCode: 200,
            message: "Counter updated successfully",
            data: updatedCounter
        });
    } catch (error) {
        next(error);
    }
}

//function to delete counter
export async function deleteCounter(req, res, next) {
    try{
        const { counterId } = req.params;

        //check if counter exists
        const counter = await counterModel.findById(counterId);
        if (!counter) {
            return errorResponse(res,
            {
                statusCode: 404,
                message: "Counter not found"
            })
        }

        //delete counter
        const deletedCounter = await counterModel.findByIdAndDelete(counterId);

        return successResponse(res,
        {
            statusCode: 200,
            message: "Counter deleted successfully",
            data: deletedCounter
        })
    }
    catch (error) {
        next(error);
    }
}