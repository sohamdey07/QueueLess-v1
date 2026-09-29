import availabilityModel from "../models/dailyAvailability.model.js";
import serviceModel from "../models/service.model.js";
import { successResponse, errorResponse} from "../utils/apiResponse.js";
import { isValidDateString, isPastDate } from "../utils/date.js";


//create availability function
export async function createAvailability(req, res,next) {
    try{
        const { serviceId } = req.params;
        const { date, capacity } = req.body;

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
        
        //check service exists
        const service = await serviceModel.findById(serviceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }
        
        //check duplicate availability for the same service and date
        const existingAvailability = await availabilityModel.findOne({ serviceId, date });

        if (existingAvailability) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Availability for this service on the specified date already exists"
            });
        }

        //create new availability
        const newAvailability = await availabilityModel.create({
            serviceId,
            date,
            capacity
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Availability created successfully",
            data: newAvailability
        });

    }
    catch (error) {
        next(error);
    }
}

//update availability function
export async function updateAvailability(req, res,next) {
    try{
        
        const { availabilityId } = req.params;
        const { date, capacity, status } = req.body;

        const availability = await availabilityModel.findById(
            availabilityId
        );

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

        // If date is being changed
        if (date !== undefined) {

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
        if (capacity !== undefined && capacity < availability.bookedCount) {
            return errorResponse(res, {
                statusCode: 400,
                message: `Capacity cannot be less than the current booked count.`
            });
        }

        if (capacity !== undefined && capacity >= availability.bookedCount) {
            availability.capacity = capacity;

            if(availability.bookedCount === availability.capacity){
                availability.status = "FULL";
            }
            if(availability.bookedCount < availability.capacity)
            {
                availability.status = "OPEN";
            }
        }

        // Update status only if provided
        if (status !== undefined) {
            availability.status = status;
        }

        await availability.save();

        return successResponse(res, {
            statusCode: 200,
            message: "Availability updated successfully",
            data: availability
        });
    }
    catch (error) {
        next(error);
    }
}

//delete availability function
export async function deleteAvailability(req, res,next) {
    try{
        const { availabilityId } = req.params;

        const availability = await availabilityModel.findById(availabilityId);

        if (!availability) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Availability not found"
            });
        }

        await availabilityModel.findByIdAndDelete(availabilityId);

        return successResponse(res, {
            statusCode: 200,
            message: "Availability deleted successfully",
            data: availability
        });
    }
    catch (error) {
        next(error);
    }
}

//get availability function
export async function getAvailability(req, res,next) {
    try{
        const { serviceId } = req.params;

        const service = await serviceModel.findById(serviceId);

        if (!service) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Service not found"
            });
        }
        
        const availability = await availabilityModel.find({ serviceId }).sort({ date: 1 });

        if (availability.length === 0) {
            return errorResponse(res, {
                statusCode: 404,
                message: "No availability found for this service"
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Availability fetched successfully",
            data: availability
        });
    }
    catch (error) {
        next(error);
    }
}