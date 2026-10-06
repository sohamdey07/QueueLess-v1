import mongoose from "mongoose";
import crypto from "crypto";

import appointmentModel from "../models/appointment.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";
import idempotencyKeyModel from "../models/idempotencyKey.model.js";
import userModel from "../models/user.model.js";
import serviceModel from "../models/service.model.js";
import { sendEmail } from "./mail.service.js";
import getAppointmentConfirmationHtml from "../utils/appointmentEmail.js";
import getAppointmentConfirmationText from "../utils/appointmentEmailText.js";

import logger from "../utils/logger.js";

import {
    isValidDateString,
    isPastDate
} from "../utils/date.js";

import { generateAppointmentId } from "../utils/generateId.js";




// ============================================================
// Configuration
// ============================================================

const MAX_TRANSACTION_RETRIES = 5;


// ============================================================
// Utility: Sleep
// ============================================================

const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};


// ============================================================
// Utility: Generate request hash
// ============================================================

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

    return crypto
        .createHash("sha256")
        .update(requestData)
        .digest("hex");
};


// ============================================================
// Create Appointment
// ============================================================

const createAppointment = async ({
    userId,
    serviceId,
    availabilityId,
    idempotencyKey
}) => {

    // --------------------------------------------------------
    // 1. Idempotency key validation
    // --------------------------------------------------------

    if (!idempotencyKey) {
        const error = new Error(
            "Idempotency-Key header is required"
        );

        error.statusCode = 400;

        throw error;
    }


    // --------------------------------------------------------
    // 2. Check user
    // --------------------------------------------------------

    const user = await userModel.findById(userId);

    if (!user) {
        const error = new Error(
            "User not found"
        );

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


    // --------------------------------------------------------
    // 3. Check service
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 4. Check availability
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 5. Get appointment date
    // --------------------------------------------------------

    const appointmentDate = availability.date;


    // --------------------------------------------------------
    // 6. Validate appointment date
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 7. Generate request hash
    // --------------------------------------------------------

    const requestHash = generateRequestHash({
        userId,
        serviceId,
        availabilityId
    });


    // ========================================================
    // Transaction retry loop
    // ========================================================

    for (
        let attempt = 0;
        attempt < MAX_TRANSACTION_RETRIES;
        attempt++
    ) {

        const session = await mongoose.startSession();

        try {

            // ------------------------------------------------
            // Check idempotency key
            //
            // We check this on every retry because another
            // concurrent request using the same key could
            // have completed while this request was retrying.
            // ------------------------------------------------

            const existingKey =
                await idempotencyKeyModel.findOne({
                    key: idempotencyKey
                });


            if (existingKey) {

                // Same key but different request
                if (
                    existingKey.requestHash !==
                    requestHash
                ) {

                    const error = new Error(
                        "Idempotency key has already been used for a different request"
                    );

                    error.statusCode = 409;

                    throw error;
                }


                // Previous request already completed
                if (existingKey.response) {

                    return {
                        statusCode:
                            existingKey.statusCode,

                        data:
                            existingKey.response,

                        idempotent: true
                    };
                }


                // Key exists but request has no response
                const error = new Error(
                    "A request with this idempotency key is already being processed"
                );

                error.statusCode = 409;

                throw error;
            }


            // ------------------------------------------------
            // Transaction
            // ------------------------------------------------

            let result;

            await session.withTransaction(async () => {

                // --------------------------------------------
                // Reserve idempotency key
                // --------------------------------------------

                await idempotencyKeyModel.create(
                    [
                        {
                            key: idempotencyKey,

                            userId: user._id,

                            endpoint:
                                "POST /api/v1/appointments/:serviceId/:availabilityId",

                            requestHash,

                            statusCode: null,

                            response: null,

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


                // --------------------------------------------
                // Atomically reserve availability
                //
                // IMPORTANT:
                //
                // bookedCount is incremented and status is
                // updated in ONE database operation.
                // --------------------------------------------

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

                        [
                            {
                                $set: {
                                    bookedCount: {
                                        $add: [
                                            "$bookedCount",
                                            1
                                        ]
                                    }
                                }
                            },

                            {
                                $set: {
                                    status: {
                                        $cond: [
                                            {
                                                $gte: [
                                                    "$bookedCount",
                                                    "$capacity"
                                                ]
                                            },
                                            "FULL",
                                            "OPEN"
                                        ]
                                    }
                                }
                            }
                        ],

                        {
                            returnDocument: "after",
                            updatePipeline: true,
                            session
                        }
                    );


                // --------------------------------------------
                // No available slot
                // --------------------------------------------

                if (!updatedAvailability) {

                    const error = new Error(
                        "No appointment slots are available for the selected date"
                    );

                    error.statusCode = 409;

                    throw error;
                }


                // --------------------------------------------
                // Generate appointment ID
                // --------------------------------------------

                const appointmentId =
                    generateAppointmentId();


                // --------------------------------------------
                // Create appointment
                // --------------------------------------------

                const [appointment] =
                    await appointmentModel.create(
                        [
                            {
                                appointmentId,

                                customerId:
                                    user._id,

                                customerName:
                                    user.name,

                                customerEmail:
                                    user.email,

                                customerPhone:
                                    user.phone,

                                serviceId:
                                    service._id,

                                appointmentDate:
                                    updatedAvailability.date,

                                status:
                                    "BOOKED",

                                queueEntryId:
                                    null,

                                checkedInAt:
                                    null,

                                completedAt:
                                    null,

                                cancelledAt:
                                    null,

                                noShowAt:
                                    null
                            }
                        ],
                        {
                            session
                        }
                    );


                // --------------------------------------------
                // Response data
                // --------------------------------------------

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


                // --------------------------------------------
                // Complete idempotency record
                // --------------------------------------------

                await idempotencyKeyModel.updateOne(
                    {
                        key: idempotencyKey
                    },

                    {
                        $set: {
                            statusCode: 201,

                            response:
                                responseData
                        }
                    },

                    {
                        session
                    }
                );


                // --------------------------------------------
                // Transaction result
                // --------------------------------------------

                result = {
                    statusCode: 201,

                    data:
                        responseData,

                    idempotent: false
                };

            });


            // ------------------------------------------------
            // Transaction successful
            // ------------------------------------------------

            // if (!result.idempotent) {

            // try {
            //     await sendEmail(
            //         user.email,
            //         `Appointment Confirmed - ${result.data.appointmentId}`,
            //         getAppointmentConfirmationText({
            //             name: user.name,
            //             email: user.email,
            //             phone: user.phone,
            //             serviceName: result.data.serviceName,
            //             appointmentDate: result.data.appointmentDate,
            //             appointmentId: result.data.appointmentId
            //         }),
            //         getAppointmentConfirmationHtml({
            //             name: user.name,
            //             email: user.email,
            //             phone: user.phone,
            //             serviceName: result.data.serviceName,
            //             appointmentDate: result.data.appointmentDate,
            //             appointmentId: result.data.appointmentId
            //         })
            //     );
            //     } catch (emailError) {
            //         logger.error(
            //             {
            //                 err: emailError,
            //                 appointmentId: result.data.appointmentId,
            //                 email: user.email
            //             },
            //             "Failed to send appointment confirmation email"
            //         );
            //     }
            // }



            return result;


        } catch (error) {

            // ------------------------------------------------
            // Duplicate idempotency key
            // ------------------------------------------------

            if (
                error?.code === 11000 &&
                (
                    error?.keyPattern?.key ||
                    error?.keyValue?.key
                )
            ) {

                /*
                 * Another concurrent request with the same
                 * Idempotency-Key may have completed first.
                 */

                const existingKey =
                    await idempotencyKeyModel.findOne({
                        key: idempotencyKey
                    });


                if (
                    existingKey &&
                    existingKey.requestHash === requestHash &&
                    existingKey.response
                ) {

                    return {
                        statusCode:
                            existingKey.statusCode,

                        data:
                            existingKey.response,

                        idempotent: true
                    };
                }


                const duplicateKeyError =
                    new Error(
                        "A request with this idempotency key is already being processed"
                    );

                duplicateKeyError.statusCode = 409;

                throw duplicateKeyError;
            }


            // ------------------------------------------------
            // Check transient transaction error
            // ------------------------------------------------

            const isTransientTransactionError =
                error?.hasErrorLabel?.(
                    "TransientTransactionError"
                );


            // ------------------------------------------------
            // Non-transient error
            // ------------------------------------------------

            if (!isTransientTransactionError) {
                throw error;
            }


            // ------------------------------------------------
            // Last attempt failed
            // ------------------------------------------------

            if (
                attempt ===
                MAX_TRANSACTION_RETRIES - 1
            ) {
                throw error;
            }


            // ------------------------------------------------
            // Exponential backoff + jitter
            // ------------------------------------------------

            const baseDelay =
                50 * Math.pow(2, attempt);

            const jitter =
                Math.floor(
                    Math.random() * 50
                );

            const delay =
                baseDelay + jitter;


            await sleep(delay);


        } finally {

            await session.endSession();
        }
    }


    // --------------------------------------------------------
    // Should never reach here
    // --------------------------------------------------------

    const error = new Error(
        "Unable to create appointment"
    );

    error.statusCode = 500;

    throw error;
};


// ============================================================
// Export
// ============================================================

export {
    createAppointment
};