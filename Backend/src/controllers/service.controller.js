import serviceModel from "../models/service.model.js";
import {successResponse, errorResponse} from "../utils/apiResponse.js";
import { uploadImage } from "../services/storage.service.js";


//create new service function
export async function createService(req, res, next) {
    try{
        const {name, code, description, service_time, duration, capacity} = req.body;

        if(!name || !code || !service_time || !duration || !capacity){
            return errorResponse(res, {
                statusCode: 400,
                message: "Missing required fields"
            });
        }   

        const existingService = await serviceModel.findOne({code: code.toUpperCase()});

        if(existingService){
            return errorResponse(res, {
                statusCode: 409,
                message: "Service with this code already exists"
            });
        }

        const imageFile = req.file;
        const imageUrl = imageFile ? await uploadImage(imageFile) : undefined;

        const newService = await serviceModel.create({
            name,
            code,
            description,
            imageUrl,
            service_time,
            duration,
            capacity
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Service created successfully",
            data: newService
        });
    }
    catch (err) {
        next(err);
    }
}

//update the existing service function
export async function updateService(req, res, next) {
  try {
        const { serviceId } = req.params;

        const {name, code, description, service_time, duration, capacity, isActive} = req.body;

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
            updateData.name = name;
        }

        if (code !== undefined) {
            updateData.code = code;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (service_time !== undefined) {
            updateData.service_time = service_time;
        }

        if (duration !== undefined) {
            updateData.duration = duration;
        }

        if (capacity !== undefined) {
            updateData.capacity = capacity;
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        // Upload new image only if user provided one
        if (req.file) {
            const imageUrl = await uploadImage(req.file);

            updateData.imageUrl = imageUrl;
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

//delete the existing service function
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

        await serviceModel.findByIdAndDelete(serviceId);

        return successResponse(res, {
            statusCode: 200,
            message: "Service deleted successfully"
        });
    } 
    catch (err) {
        next(err);
    }
}

//get all services function
export async function getAllServices(req, res, next) {
    try {
        const services = await serviceModel.find().sort({ createdAt: -1 }).limit(10); // Limit to 10 services for performance

        if (services.length === 0) {
            return errorResponse(res, {
                statusCode: 404,
                message: "No services found"
            });
        }
        return successResponse(res, {
            statusCode: 200,
            message: "Services retrieved successfully",
            data: services
        });
    }
    catch (err) {
        next(err);
    }
}

//get service by id function
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
    }
    catch (err) {
        next(err);
    }
}

