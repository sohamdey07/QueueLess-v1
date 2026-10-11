import availabilityModel from "../models/dailyAvailability.model.js";
import serviceModel from "../models/service.model.js";
import queueModel from "../models/queue.model.js";

import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { isValidDateString, isPastDate } from "../utils/date.js";

import mongoose from "mongoose";

// Get all availabilities (with optional serviceId, date, status filters)
export async function getAllAvailabilities(req, res, next) {
    try {
        const { serviceId, date, status } = req.query;
        const filter = {};

        if (serviceId) {
            filter.serviceId = serviceId;
        }
        if (date) {
            filter.date = date;
        }
        if (status) {
            filter.status = status.toUpperCase();
        }

        const availabilities = await availabilityModel
            .find(filter)
            .populate("serviceId", "name code service_time duration isActive")
            .sort({ date: 1, createdAt: -1 });

        return successResponse(res, {
            statusCode: 200,
            message: "Availabilities fetched successfully",
            data: availabilities
        });
    } catch (error) {
        next(error);
    }
}

// Get availability for a specific service
export async function getAvailability(req, res, next) {
    try {
        const { serviceId } = req.params;
        const { date } = req.query;

        const service = await serviceModel.findById(serviceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        const query = { serviceId };
        if (date) {
            query.date = date;
        }

        const availability = await availabilityModel
            .find(query)
            .populate("serviceId", "name code service_time duration isActive")
            .sort({ date: 1 });

        return successResponse(res, {
            statusCode: 200,
            message: "Availability fetched successfully",
            data: availability
        });
    } catch (error) {
        next(error);
    }
}

// Create availability function
export async function createAvailability(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const effectiveServiceId = req.params.serviceId || req.body.serviceId;
        const { date, capacity, status } = req.body;

        if (!effectiveServiceId) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Service ID is required"
            });
        }

        // Date validation
        if (!isValidDateString(date)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Invalid date. Use YYYY-MM-DD format."
            });
        }

        // Past date check
        if (isPastDate(date)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Availability cannot be created for a past date"
            });
        }

        // Check service exists
        const service = await serviceModel.findById(effectiveServiceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        // Check duplicate availability
        const existingAvailability = await availabilityModel.findOne({
            serviceId: effectiveServiceId,
            date
        });

        if (existingAvailability) {
            return errorResponse(res, {
                statusCode: 409,
                message: "Availability for this service on the specified date already exists"
            });
        }

        let newAvailability;

        await session.withTransaction(async () => {
            const [availability] = await availabilityModel.create(
                [
                    {
                        serviceId: effectiveServiceId,
                        date,
                        capacity: Number(capacity),
                        bookedCount: 0,
                        status: status ? status.toUpperCase() : "OPEN"
                    }
                ],
                { session }
            );

            newAvailability = availability;

            // Ensure queue exists for this service + date
            const existingQueue = await queueModel.findOne({ serviceId: effectiveServiceId, date }).session(session);
            if (!existingQueue) {
                await queueModel.create(
                    [
                        {
                            serviceId: effectiveServiceId,
                            date,
                            currentToken: 0,
                            nextToken: 1,
                            status: "ACTIVE"
                        }
                    ],
                    { session }
                );
            }
        });

        const populated = await availabilityModel
            .findById(newAvailability._id)
            .populate("serviceId", "name code service_time duration isActive");

        return successResponse(res, {
            statusCode: 201,
            message: "Availability created successfully",
            data: populated || newAvailability
        });
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
}

// Update availability function
export async function updateAvailability(req, res, next) {
    try {
        const { availabilityId } = req.params;
        const { date, capacity, status, serviceId } = req.body;

        const availability = await availabilityModel.findById(availabilityId);

        if (!availability) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Availability not found"
            });
        }

        // Do not allow modification of a past availability
        if (isPastDate(availability.date)) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Past availability cannot be updated"
            });
        }

        // If serviceId is being updated
        if (serviceId !== undefined && serviceId !== availability.serviceId.toString()) {
            const service = await serviceModel.findById(serviceId);
            if (!service) {
                return errorResponse(res, {
                    statusCode: 404,
                    message: "Selected service not found"
                });
            }
            availability.serviceId = serviceId;
        }

        // If date is being changed
        if (date !== undefined && date !== availability.date) {
            if (!isValidDateString(date)) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Invalid date. Use YYYY-MM-DD format."
                });
            }

            if (isPastDate(date)) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Availability cannot be updated to a past date"
                });
            }

            // Check duplicate service + date
            const existingAvailability = await availabilityModel.findOne({
                serviceId: availability.serviceId,
                date,
                _id: { $ne: availabilityId }
            });

            if (existingAvailability) {
                return errorResponse(res, {
                    statusCode: 409,
                    message: "Availability for this service on the specified date already exists"
                });
            }

            availability.date = date;
        }

        // Update capacity only if provided
        if (capacity !== undefined) {
            const numCapacity = Number(capacity);
            if (numCapacity < availability.bookedCount) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: `Capacity (${numCapacity}) cannot be less than the current booked count (${availability.bookedCount}).`
                });
            }

            availability.capacity = numCapacity;

            if (status === undefined) {
                if (availability.bookedCount >= availability.capacity) {
                    availability.status = "FULL";
                } else if (availability.status === "FULL") {
                    availability.status = "OPEN";
                }
            }
        }

        // Update status only if provided
        if (status !== undefined) {
            availability.status = status.toUpperCase();
        }

        await availability.save();

        const populated = await availabilityModel
            .findById(availability._id)
            .populate("serviceId", "name code service_time duration isActive");

        return successResponse(res, {
            statusCode: 200,
            message: "Availability updated successfully",
            data: populated || availability
        });
    } catch (error) {
        next(error);
    }
}

// Delete availability function
export async function deleteAvailability(req, res, next) {
    try {
        const { availabilityId } = req.params;

        const availability = await availabilityModel.findById(availabilityId);

        if (!availability) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Availability not found"
            });
        }

        if (availability.bookedCount > 0) {
            return errorResponse(res, {
                statusCode: 400,
                message: `Cannot delete availability with ${availability.bookedCount} active booking(s).`
            });
        }

        await availabilityModel.findByIdAndDelete(availabilityId);

        return successResponse(res, {
            statusCode: 200,
            message: "Availability deleted successfully",
            data: availability
        });
    } catch (error) {
        next(error);
    }
}