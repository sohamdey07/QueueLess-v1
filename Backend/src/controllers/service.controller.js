import serviceModel from "../models/service.model.js";
import counterModel from "../models/counter.model.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { uploadImage } from "../services/storage.service.js";
import logger from "../utils/logger.js";

// Create new service function
export async function createService(req, res, next) {
    try {
        const { name, code, description, service_time, duration, capacity, isActive } = req.body;

        if (!name || !code || !service_time || !duration || !capacity) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Missing required fields"
            });
        }

        const normalizedCode = code.toUpperCase().trim();

        const existingService = await serviceModel.findOne({ code: normalizedCode });

        if (existingService) {
            return errorResponse(res, {
                statusCode: 409,
                message: `Service with code '${normalizedCode}' already exists`
            });
        }

        let imageUrl = req.body.imageUrl || undefined;
        if (req.file) {
            try {
                imageUrl = await uploadImage(req.file);
            } catch (uploadErr) {
                logger.error({ err: uploadErr }, "Image upload failed during service creation");
            }
        }

        const newService = await serviceModel.create({
            name: name.trim(),
            code: normalizedCode,
            description: description ? description.trim() : "",
            imageUrl,
            service_time: service_time.trim(),
            duration: Number(duration),
            capacity: Number(capacity),
            isActive: isActive !== undefined ? (isActive === true || isActive === "true") : true
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Service created successfully",
            data: newService
        });
    } catch (err) {
        next(err);
    }
}

// Update existing service function
export async function updateService(req, res, next) {
    try {
        const { serviceId } = req.params;
        const { name, code, description, service_time, duration, capacity, isActive, imageUrl } = req.body;

        // Check whether service exists
        const service = await serviceModel.findById(serviceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        // Build update object only with provided fields
        const updateData = {};

        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (code !== undefined) {
            const normalizedCode = code.toUpperCase().trim();
            if (normalizedCode !== service.code) {
                const duplicate = await serviceModel.findOne({
                    code: normalizedCode,
                    _id: { $ne: serviceId }
                });
                if (duplicate) {
                    return errorResponse(res, {
                        statusCode: 409,
                        message: `Service with code '${normalizedCode}' already exists`
                    });
                }
            }
            updateData.code = normalizedCode;
        }

        if (description !== undefined) {
            updateData.description = description ? description.trim() : "";
        }

        if (service_time !== undefined) {
            updateData.service_time = service_time.trim();
        }

        if (duration !== undefined) {
            updateData.duration = Number(duration);
        }

        if (capacity !== undefined) {
            updateData.capacity = Number(capacity);
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive === true || isActive === "true";
        }

        if (imageUrl !== undefined && imageUrl !== "") {
            updateData.imageUrl = imageUrl;
        }

        // Upload new image only if user provided a file
        if (req.file) {
            try {
                const uploadedUrl = await uploadImage(req.file);
                updateData.imageUrl = uploadedUrl;
            } catch (uploadErr) {
                logger.error({ err: uploadErr }, "Image upload failed during service update");
            }
        }

        const updatedService = await serviceModel.findByIdAndUpdate(
            serviceId,
            {
                $set: updateData
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        return successResponse(res, {
            statusCode: 200,
            message: "Service updated successfully",
            data: updatedService
        });
    } catch (error) {
        next(error);
    }
}

// Delete existing service function
export async function deleteService(req, res, next) {
    try {
        const { serviceId } = req.params;

        // Check whether service exists
        const existingService = await serviceModel.findById(serviceId);

        if (!existingService) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        // Check if any counter is currently assigned to this service
        const counterUsingService = await counterModel.findOne({ serviceId });
        if (counterUsingService) {
            return errorResponse(res, {
                statusCode: 400,
                message: `Cannot delete service because counter '${counterUsingService.name}' (${counterUsingService.code}) is assigned to it. Please reassign the counter first or deactivate this service.`
            });
        }

        await serviceModel.findByIdAndDelete(serviceId);

        return successResponse(res, {
            statusCode: 200,
            message: "Service deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}

// Get all services function
export async function getAllServices(req, res, next) {
    try {
        const filter = {};
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === "true";
        }

        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
        let query = serviceModel.find(filter).sort({ createdAt: -1 });

        if (limit > 0) {
            query = query.limit(limit);
        }

        const services = await query;

        return successResponse(res, {
            statusCode: 200,
            message: services.length === 0 ? "No services found" : "Services retrieved successfully",
            data: services
        });
    } catch (err) {
        next(err);
    }
}

// Get service by ID function
export async function getServiceById(req, res, next) {
    try {
        const { serviceId } = req.params;

        if (!serviceId) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Service ID is required"
            });
        }

        const service = await serviceModel.findById(serviceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Service retrieved successfully",
            data: service
        });
    } catch (err) {
        next(err);
    }
}
