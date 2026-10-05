import {createAppointment as createAppointmentService} from "../services/appointment.service.js";
import {successResponse,errorResponse} from "../utils/apiResponse.js";
import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";
import queueModel from "../models/queue.model.js";
import queueEntryModel from "../models/queueEntry.model.js";
import {isPastDate,getTodayDate} from "../utils/date.js";





//function to create appointment
export async function createAppointment(req, res, next) {
    try {
        const { serviceId, availabilityId } = req.params;

        const result = await createAppointmentService({
            userId: req.user.id,
            serviceId,
            availabilityId,
            idempotencyKey: req.headers["idempotency-key"]
        });

        return successResponse(res, {
            statusCode: result.statusCode,
            message: result.idempotent
                ? "Appointment already booked"
                : "Appointment booked successfully",
            data: result.data
        });

    } catch (error) {
        next(error);
    }
}

//get all appointments for a user
export async function getAppointments(req, res, next) {
    try{
        const userId = req.user.id;
        const appointments = await appointmentModel.find({ customerId: userId }).sort({ appointmentDate: -1, createdAt: -1 });

        if (!appointments || appointments.length === 0) {
            return successResponse(res, {
                statusCode: 200,
                message: "No appointments found",
                data: []
            });
        }
        
        return successResponse(res, {
            statusCode: 200,
            message: "Appointments retrieved successfully",
            data: appointments
        });
    }
    catch (error) {
        next(error);
    }
}

//get data  of a single appointment
export async function getAppointmentById(req, res, next) {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        const appointment = await appointmentModel.findOne({ appointmentId: appointmentId, customerId: userId });

        if (!appointment) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Appointment not found"
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Appointment retrieved successfully",
            data: appointment
        });
    }
    catch (error) {
        next(error);
    }
}

//cancel an appointment
export async function cancelAppointment(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        let cancelledAppointment;

        await session.withTransaction(async () => {

            // Find appointment belonging to the logged-in customer
            const appointment = await appointmentModel.findOne({
                appointmentId,
                customerId: userId
            }).session(session);

            if (!appointment) {
                return errorResponse(res, {
                    statusCode: 404,
                    message: "Appointment not found"
                });
            }

            // Already cancelled
            if (appointment.status === "CANCELLED") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Appointment is already cancelled"
                });
            }

            // Completed appointment
            if (appointment.status === "COMPLETED") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Completed appointment cannot be cancelled"
                });
            }

            // No-show appointment
            if (appointment.status === "NO_SHOW") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "No-show appointment cannot be cancelled"
                });
            }

            // Already checked in
            if (appointment.status === "CHECKED_IN") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Checked-in appointment cannot be cancelled"
                });
            }

            // Currently being served
            if (appointment.status === "IN_SERVICE") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Appointment in service cannot be cancelled"
                });
            }

            // Only BOOKED appointment can be cancelled
            if (appointment.status !== "BOOKED") {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Appointment cannot be cancelled in its current state"
                });
            }

            // Prevent cancellation of a past appointment
            if (isPastDate(appointment.appointmentDate)) {
                return errorResponse(res, {
                    statusCode: 400,
                    message: "Cannot cancel a past appointment"
                });
            }

            // Find corresponding availability
            const availability = await availabilityModel.findOne({
                serviceId: appointment.serviceId,
                date: appointment.appointmentDate
            }).session(session);

            if (!availability) {
                return errorResponse(res, {
                    statusCode: 500,
                    message: "Availability record not found for this appointment"
                });
            }

            // Safety check
            if (availability.bookedCount <= 0) {
                return errorResponse(res, {
                    statusCode: 500,
                    message: "Inconsistent availability data: booked count is already zero"
                });
            }

            /*
             * Decrease booked count.
             *
             * If the availability was FULL, reopening one slot
             * changes the status from FULL -> OPEN.
             *
             * If it was already OPEN, keep it OPEN.
             *
             * If it was CLOSED, keep it CLOSED.
             */
            availability.bookedCount -= 1;

            if (availability.status === "FULL") {
                availability.status = "OPEN";
            }

            await availability.save({ session });

            // Cancel appointment
            appointment.status = "CANCELLED";
            appointment.cancelledAt = new Date();

            await appointment.save({ session });

            cancelledAppointment = appointment;
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Appointment cancelled successfully",
            data: cancelledAppointment
        });

    } catch (error) {
        next(error);

    } finally {
        await session.endSession();
    }
}

//function for checking in an appointment
export async function checkInAppointment(req, res, next) {

    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        const session = await mongoose.startSession();

        try {

            let result;

            await session.withTransaction(async () => {

                // ------------------------------------------------
                // 1. Find appointment
                // ------------------------------------------------

                const appointment = await appointmentModel.findOne({
                    appointmentId,
                    customerId: userId
                }).session(session);

                if (!appointment) {
                    const error = new Error(
                        "Appointment not found"
                    );

                    error.statusCode = 404;

                    throw error;
                }

                if (!mongoose.isValidObjectId(appointment.serviceId)) {
                    const error = new Error(
                        "Appointment has an invalid service reference"
                    );

                    error.statusCode = 500;

                    throw error;
                }


                // ------------------------------------------------
                // 2. Check appointment status
                // ------------------------------------------------

                if (appointment.status !== "BOOKED") {

                    const error = new Error(
                        `Appointment cannot be checked in because its current status is ${appointment.status}`
                    );

                    error.statusCode = 409;

                    throw error;
                }


                // ------------------------------------------------
                // 3. Check appointment date
                // ------------------------------------------------

                const today = getTodayDate();

                if (appointment.appointmentDate !== today) {

                    if (isPastDate(appointment.appointmentDate)) {

                        const error = new Error(
                            "You cannot check in for a past appointment"
                        );

                        error.statusCode = 400;

                        throw error;
                    }

                    const error = new Error(
                        "You can only check in for today's appointment"
                    );

                    error.statusCode = 400;

                    throw error;
                }


                // ------------------------------------------------
                // 4. Get queue and generate token atomically
                // ------------------------------------------------

                const updatedQueue =
                    await queueModel.findOneAndUpdate(
                        {
                            serviceId: appointment.serviceId,
                            date: appointment.appointmentDate,
                            status: "ACTIVE"
                        },
                        {
                            $setOnInsert: {
                                serviceId: appointment.serviceId,
                                date: appointment.appointmentDate,
                                currentToken: 0,
                                nextToken: 1,
                                status: "ACTIVE"
                            },

                            $inc: {
                                nextToken: 1
                            }
                        },
                        {
                            upsert: true,
                            new: true,
                            session
                        }
                    );

                if (!updatedQueue) {

                    const error = new Error(
                        "Unable to generate queue token"
                    );

                    error.statusCode = 500;

                    throw error;
                }


                // ------------------------------------------------
                // 5. Determine token number
                // ------------------------------------------------

                const tokenNumber =
                    updatedQueue.nextToken - 1;


                // ------------------------------------------------
                // 6. Create queue entry
                // ------------------------------------------------

                const [queueEntry] =
                    await queueEntryModel.create(
                        [
                            {
                                appointmentId: appointment._id,
                                serviceId:appointment.serviceId,
                                queueId:updatedQueue._id,
                                tokenNumber,
                                status: "WAITING",
                                counterId: null,
                                joinedAt: new Date(),
                                calledAt: null,
                                servingAt: null,
                                completedAt: null
                            }
                        ],
                        {
                            session
                        }
                    );


                // ------------------------------------------------
                // 7. Update appointment
                // ------------------------------------------------

                appointment.status = "CHECKED_IN";
                appointment.queueEntryId =queueEntry._id;
                appointment.counterId = null;
                appointment.checkedInAt =new Date();

                await appointment.save({
                    session
                });


                // ------------------------------------------------
                // 8. Prepare response
                // ------------------------------------------------

                result = {
                    appointmentId:appointment.appointmentId,
                    serviceId:appointment.serviceId,
                    appointmentDate:appointment.appointmentDate,
                    queueEntryId:queueEntry._id,
                    tokenNumber,
                    status:appointment.status,
                    joinedAt:queueEntry.joinedAt
                };

            });


            // ----------------------------------------------------
            // Transaction successful
            // ----------------------------------------------------

            return successResponse(res, {
                statusCode: 200,
                message: "Appointment checked in successfully",
                data: result
            });

        } finally {

            await session.endSession();

        }

    } catch (error) {

        // Duplicate appointment check-in
        if (error?.code === 11000) {

            return errorResponse(res, {
                statusCode: 409,
                message: "Appointment has already been checked in"
            });
        }

        if (error?.name === "CastError") {
            return errorResponse(res, {
                statusCode: 400,
                message: `Invalid ${error.path || "resource"} identifier`
            });
        }

        next(error);
    }
}