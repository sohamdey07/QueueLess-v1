import mongoose from "mongoose";
import crypto from "crypto";

import appointmentModel from "../models/appointment.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";
import idempotencyKeyModel from "../models/idempotencyKey.model.js";
import userModel from "../models/user.model.js";
import serviceModel from "../models/service.model.js";

import { isValidDateString , isPastDate } from "../utils/date.js";

import { generateAppointmentId } from "../utils/generateId.js";


// Generate request hash
const generateRequestHash = ({
    userId,
    serviceId,
     availabilityId
}) => {
    const requestData = JSON.stringify({
        userId: userId.toString(),
        serviceId: serviceId.toString(),
        availabilityId: availabilityId.toString()
    });

    return crypto.createHash("sha256").update(requestData).digest("hex");

};

//==============================================================
// Create appointment
//==============================================================

const createAppointment = async ({
    userId,
    serviceId,
    availabilityId,
    idempotencyKey
}) => {

    // --------------------------------------------------
    // Idempotency key
    // --------------------------------------------------

    if (!idempotencyKey) {
        const error = new Error(
            "Idempotency-Key header is required"
        );

        error.statusCode = 400;
        throw error;
    }


    // --------------------------------------------------
    // Check user
    // --------------------------------------------------

    const user = await userModel.findById(userId);

    if (!user) {
        const error = new Error("User not found");

        error.statusCode = 404;
        throw error;
    }

    if (!user.isVerified) {
        const error = new Error(
            "Account must be verified before booking an appointment"
        );

        error.statusCode = 403;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error(
            "User account is inactive"
        );

        error.statusCode = 403;
        throw error;
    }


    // --------------------------------------------------
    // Check service
    // --------------------------------------------------

    const service = await serviceModel.findOne({
        _id: serviceId,
        isActive: true
    });

    if (!service) {
        const error = new Error(
            "Service not found or inactive"
        );

        error.statusCode = 404;
        throw error;
    }


    // --------------------------------------------------
    // Check availability
    // --------------------------------------------------

    const availability = await availabilityModel.findOne({
        _id: availabilityId,
        serviceId
    });

    if (!availability) {
        const error = new Error(
            "Availability not found for this service"
        );

        error.statusCode = 404;
        throw error;
    }


    // --------------------------------------------------
    // Get appointment date from availability
    // --------------------------------------------------

    const appointmentDate = availability.date;


    // --------------------------------------------------
    // Validate appointment date
    // --------------------------------------------------

    if (!isValidDateString(appointmentDate)) {
        const error = new Error(
            "Invalid availability date"
        );

        error.statusCode = 400;
        throw error;
    }


    if (isPastDate(appointmentDate)) {
        const error = new Error(
            "Cannot book an appointment for a past date"
        );

        error.statusCode = 400;
        throw error;
    }


    // --------------------------------------------------
    // Generate idempotency request hash
    // --------------------------------------------------

    const requestHash = generateRequestHash({
        userId,
        serviceId,
        availabilityId
    });


    // --------------------------------------------------
    // Check existing idempotency key
    // --------------------------------------------------

    const existingKey = await idempotencyKeyModel.findOne({
        key: idempotencyKey
    });

    if (existingKey) {

        if (existingKey.requestHash !== requestHash) {
            const error = new Error(
                "Idempotency key has already been used for a different request"
            );

            error.statusCode = 409;
            throw error;
        }

        if (existingKey.response) {
            return {
                statusCode: existingKey.statusCode,
                data: existingKey.response,
                idempotent: true
            };
        }

        const error = new Error(
            "A request with this idempotency key is already being processed"
        );

        error.statusCode = 409;
        throw error;
    }


    // --------------------------------------------------
    // Start transaction
    // --------------------------------------------------

    const session = await mongoose.startSession();

    try {

        let result;

        await session.withTransaction(async () => {

            // ------------------------------------------
            // Atomically reserve availability
            // ------------------------------------------

            const updatedAvailability =
                await availabilityModel.findOneAndUpdate(
                    {
                        _id: availabilityId,
                        serviceId,
                        status: "OPEN",

                        $expr: {
                            $lt: [
                                "$bookedCount",
                                "$capacity"
                            ]
                        }
                    },
                    {
                        $inc: {
                            bookedCount: 1
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );


            // ------------------------------------------
            // No slot available
            // ------------------------------------------

            if (!updatedAvailability) {
                const error = new Error(
                    "No appointment slots are available for the selected date"
                );

                error.statusCode = 409;
                throw error;
            }


            // ------------------------------------------
            // Mark availability FULL
            // ------------------------------------------

            if (
                updatedAvailability.bookedCount >=
                updatedAvailability.capacity
            ) {
                await availabilityModel.updateOne(
                    {
                        _id: updatedAvailability._id
                    },
                    {
                        $set: {
                            status: "FULL"
                        }
                    },
                    {
                        session
                    }
                );
            }


            // ------------------------------------------
            // Generate appointment ID
            // ------------------------------------------

            const appointmentId =
                generateAppointmentId();


            // ------------------------------------------
            // Create appointment
            // ------------------------------------------

            const [appointment] =
                await appointmentModel.create(
                    [
                        {
                            appointmentId,

                            customerId: user._id,

                            customerName: user.name,

                            customerEmail: user.email,

                            customerPhone: user.phone,

                            serviceId: service._id,

                            appointmentDate:
                                updatedAvailability.date,

                            status: "BOOKED",

                            queueEntryId: null,

                            checkedInAt: null,

                            completedAt: null,

                            cancelledAt: null,

                            noShowAt: null
                        }
                    ],
                    {
                        session
                    }
                );


            // ------------------------------------------
            // Response data
            // ------------------------------------------

            const responseData = {
                appointmentId:
                    appointment.appointmentId,

                serviceId:
                    appointment.serviceId,

                serviceName:
                    service.name,

                availabilityId:
                    updatedAvailability._id,

                appointmentDate:
                    appointment.appointmentDate,

                status:
                    appointment.status
            };


            // ------------------------------------------
            // Save idempotency record
            // ------------------------------------------

            await idempotencyKeyModel.create(
                [
                    {
                        key: idempotencyKey,

                        userId: user._id,

                        endpoint:
                            "POST /api/v1/appointments/:serviceId/:availabilityId",

                        requestHash,

                        statusCode: 201,

                        response: responseData,

                        expiresAt: new Date(
                            Date.now() +
                            24 * 60 * 60 * 1000
                        )
                    }
                ],
                {
                    session
                }
            );


            result = {
                statusCode: 201,
                data: responseData,
                idempotent: false
            };
        });


        return result;

    } finally {
        await session.endSession();
    }
};


export {createAppointment};