import crypto from "crypto";
import { createAppointment as createAppointmentService } from "../services/appointment.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";
import serviceModel from "../models/service.model.js";
import queueModel from "../models/queue.model.js";
import queueEntryModel from "../models/queueEntry.model.js";
import userModel from "../models/user.model.js";
import { isPastDate, getTodayDate, isValidDateString } from "../utils/date.js";
import { emitQueueUpdated } from "../services/queueSocket.service.js";





//function to create appointment
export async function createAppointment(req, res, next) {
    try {
        const serviceId = req.params.serviceId || req.body?.serviceId;
        let availabilityId = req.params.availabilityId || req.body?.availabilityId;
        const date = req.body?.date || req.query?.date;

        if (!serviceId) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Service ID is required"
            });
        }

        // If availabilityId is not provided directly, look up the existing availability record for this date
        if (!availabilityId && date) {
            const availability = await availabilityModel.findOne({ serviceId, date });
            if (availability) {
                availabilityId = availability._id.toString();
            }
        }

        if (!availabilityId) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Availability ID or appointment date is required"
            });
        }

        const idempotencyKey = req.headers["idempotency-key"] || crypto.randomUUID();

        const result = await createAppointmentService({
            userId: req.user.id,
            serviceId,
            availabilityId,
            idempotencyKey
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
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("appointments");
        const userApptIds = user?.appointments || [];

        const appointments = await appointmentModel
            .find({
                $or: [
                    { customerId: userId },
                    { _id: { $in: userApptIds } }
                ]
            })
            .populate("serviceId", "name code description duration service_time imageUrl")
            .populate({
                path: "queueEntryId",
                select: "queueId tokenNumber token status joinedAt calledAt servingAt completedAt counterId",
                populate: { path: "counterId", select: "name code" }
            })
            .sort({ appointmentDate: -1, createdAt: -1 });

        // Ensure queueEntryId milestones and token strings are populated
        const enrichedAppointments = await Promise.all(
            appointments.map(async (appt) => {
                const doc = appt.toObject();
                const prefix = doc.serviceId?.code || "T";
                if (!doc.queueEntryId) {
                    const qEntry = await queueEntryModel.findOne({ appointmentId: appt._id })
                        .select("queueId tokenNumber token status joinedAt calledAt servingAt completedAt counterId")
                        .populate("counterId", "name code")
                        .lean();
                    if (qEntry) {
                        doc.queueEntryId = qEntry;
                    }
                }
                if (doc.queueEntryId) {
                    const rawNum = doc.queueEntryId.tokenNumber;
                    const formattedToken = doc.queueEntryId.token || (rawNum ? `${prefix}-${String(rawNum).padStart(3, "0")}` : null);
                    doc.queueEntryId.token = formattedToken;
                    doc.token = formattedToken;
                    doc.tokenNumber = formattedToken;
                }
                return doc;
            })
        );

        return successResponse(res, {
            statusCode: 200,
            message: "Appointments retrieved successfully",
            data: enrichedAppointments
        });
    } catch (error) {
        next(error);
    }
}

//get data of a single appointment
export async function getAppointmentById(req, res, next) {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        const appointment = await appointmentModel.findOne({ appointmentId, customerId: userId })
            .populate("serviceId", "name code description duration service_time imageUrl")
            .populate({
                path: "queueEntryId",
                select: "queueId tokenNumber token status joinedAt calledAt servingAt completedAt counterId",
                populate: { path: "counterId", select: "name code" }
            });

        if (!appointment) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Appointment not found"
            });
        }

        const doc = appointment.toObject();
        const prefix = doc.serviceId?.code || "T";
        if (!doc.queueEntryId) {
            const qEntry = await queueEntryModel.findOne({ appointmentId: appointment._id })
                .select("queueId tokenNumber token status joinedAt calledAt servingAt completedAt counterId")
                .populate("counterId", "name code")
                .lean();
            if (qEntry) {
                doc.queueEntryId = qEntry;
            }
        }
        if (doc.queueEntryId) {
            const rawNum = doc.queueEntryId.tokenNumber;
            const formattedToken = doc.queueEntryId.token || (rawNum ? `${prefix}-${String(rawNum).padStart(3, "0")}` : null);
            doc.queueEntryId.token = formattedToken;
            doc.token = formattedToken;
            doc.tokenNumber = formattedToken;
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Appointment retrieved successfully",
            data: doc
        });
    } catch (error) {
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

        // ------------------------------------------------
        // 1. Validate authenticated user ID
        // ------------------------------------------------

        if (!mongoose.isValidObjectId(userId)) {
            const error = new Error(
                "Invalid authentication user identifier"
            );

            error.statusCode = 401;
            throw error;
        }

        const customerId = new mongoose.Types.ObjectId(userId);
        const session = await mongoose.startSession();

        try {

            let result;

            await session.withTransaction(async () => {

                // ------------------------------------------------
                // 2. Validate appointment exists
                // ------------------------------------------------

                const existingAppointment = await appointmentModel.findOne({
                    appointmentId,
                    customerId
                }).session(session);

                if (!existingAppointment) {
                    const error = new Error(
                        "Appointment not found"
                    );

                    error.statusCode = 404;
                    throw error;
                }

                // ------------------------------------------------
                // 3. Validate appointment date
                // ------------------------------------------------

                const today = getTodayDate();

                if (existingAppointment.appointmentDate !== today) {

                    if (isPastDate(existingAppointment.appointmentDate)) {
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
                // 4. Atomically claim appointment for check-in
                // ------------------------------------------------

                const appointment = await appointmentModel.findOneAndUpdate(
                    {
                        _id: existingAppointment._id,
                        customerId,
                        status: "BOOKED",
                        appointmentDate: today
                    },
                    {
                        $set: {
                            status: "CHECKED_IN",
                            checkedInAt: new Date()
                        }
                    },
                    {
                        returnDocument: "after",
                        session
                    }
                );


                if (!appointment) {

                    const error = new Error(
                        `Appointment cannot be checked in because its current status is ${existingAppointment.status}`
                    );

                    error.statusCode = 409;
                    throw error;
                }

                // ------------------------------------------------
                // 5. Find existing queue
                // ------------------------------------------------

                const queue = await queueModel.findOne({
                    serviceId: appointment.serviceId,
                    date: appointment.appointmentDate,
                    status: "ACTIVE"
                }).session(session);

                if (!queue) {

                    const error = new Error(
                        "Queue is not available for this appointment date"
                    );

                    error.statusCode = 409;
                    throw error;
                }

                // ------------------------------------------------
                // 6. Atomically generate next token
                // ------------------------------------------------

                const updatedQueue =
                    await queueModel.findOneAndUpdate(
                        {
                            _id: queue._id,
                            status: "ACTIVE"
                        },
                        {
                            $inc: {
                                nextToken: 1
                            }
                        },
                        {
                            returnDocument: "after",
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

                const tokenNumber =
                    updatedQueue.nextToken - 1;

                // ------------------------------------------------
                // 7. Create queue entry with formatted token
                // ------------------------------------------------

                const service = await serviceModel.findById(appointment.serviceId).select("name code").session(session);
                const prefix = service?.code || "T";
                const tokenFormatted = `${prefix}-${String(tokenNumber).padStart(3, "0")}`;

                const [queueEntry] =
                    await queueEntryModel.create(
                        [
                            {
                                appointmentId: appointment._id,
                                serviceId: appointment.serviceId,
                                queueId: updatedQueue._id,
                                tokenNumber,
                                token: tokenFormatted,
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
                // 8. Attach queue entry to appointment
                // ------------------------------------------------

                appointment.queueEntryId = queueEntry._id;

                await appointment.save({
                    session
                });

                // ------------------------------------------------
                // 9. Prepare response
                // ------------------------------------------------

                result = {
                    appointmentId: appointment.appointmentId,
                    serviceId: appointment.serviceId,
                    serviceName: service?.name || "Service",
                    serviceCode: prefix,
                    appointmentDate: appointment.appointmentDate,
                    queueId: queue._id,
                    queueEntryId: queueEntry._id,
                    tokenNumber,
                    token: tokenFormatted,
                    status: appointment.status,
                    joinedAt: queueEntry.joinedAt
                };
            });

            // ----------------------------------------------------
            // Transaction successful - Broadcast real-time event
            // ----------------------------------------------------

            emitQueueUpdated(result.queueId, {
                type: "CUSTOMER_JOINED",
                tokenNumber: result.tokenNumber,
                token: result.token,
                queueId: result.queueId
            });

            return successResponse(res, {
                statusCode: 200,
                message: "Appointment checked in successfully",
                data: result
            });

        } finally {

            await session.endSession();

        }

    } catch (error) {
        if (error?.code === 11000) {
            return errorResponse(res, {
                statusCode: 409,
                message: "Appointment has already been checked in"
            });
        }

        next(error);
    }
}

// Function to get today's appointments overview for admin dashboard
export async function getTodayAppointmentsOverview(req, res, next) {
    try {
        const queryDate = req.query.date;
        const targetDate = (queryDate && isValidDateString(queryDate)) ? queryDate : getTodayDate();

        // 1. Fetch non-cancelled appointments for target date
        const appointments = await appointmentModel.find({
            appointmentDate: targetDate,
            status: { $ne: "CANCELLED" }
        }).select("_id appointmentId serviceId status appointmentDate");

        // 2. Fetch daily availabilities for target date
        const availabilities = await availabilityModel.find({
            date: targetDate
        }).select("serviceId bookedCount capacity status");

        // 3. Aggregate metrics by service
        const serviceStatsMap = {};

        appointments.forEach(appt => {
            const srvId = appt.serviceId?.toString();
            if (!srvId) return;

            if (!serviceStatsMap[srvId]) {
                serviceStatsMap[srvId] = {
                    totalAppointments: 0,
                    served: 0,
                    waiting: 0,
                    noShow: 0
                };
            }

            serviceStatsMap[srvId].totalAppointments += 1;
            if (appt.status === "COMPLETED") {
                serviceStatsMap[srvId].served += 1;
            } else if (["BOOKED", "CHECKED_IN", "IN_SERVICE"].includes(appt.status)) {
                serviceStatsMap[srvId].waiting += 1;
            } else if (appt.status === "NO_SHOW") {
                serviceStatsMap[srvId].noShow += 1;
            }
        });

        // Ensure daily availability bookedCount is reflected if higher
        availabilities.forEach(avail => {
            const srvId = avail.serviceId?.toString();
            if (!srvId) return;

            if (!serviceStatsMap[srvId]) {
                serviceStatsMap[srvId] = {
                    totalAppointments: avail.bookedCount || 0,
                    served: 0,
                    waiting: avail.bookedCount || 0,
                    noShow: 0
                };
            } else {
                if ((avail.bookedCount || 0) > serviceStatsMap[srvId].totalAppointments) {
                    const diff = avail.bookedCount - serviceStatsMap[srvId].totalAppointments;
                    serviceStatsMap[srvId].totalAppointments = avail.bookedCount;
                    serviceStatsMap[srvId].waiting += diff;
                }
            }
        });

        let totalAppointmentsToday = 0;
        let totalServedToday = 0;
        let totalWaitingToday = 0;
        let totalNoShowToday = 0;

        Object.values(serviceStatsMap).forEach(stat => {
            totalAppointmentsToday += stat.totalAppointments;
            totalServedToday += stat.served;
            totalWaitingToday += stat.waiting;
            totalNoShowToday += stat.noShow;
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Today's appointments overview retrieved successfully",
            data: {
                date: targetDate,
                totalAppointmentsToday,
                totalServedToday,
                totalWaitingToday,
                totalNoShowToday,
                services: serviceStatsMap
            }
        });
    } catch (error) {
        next(error);
    }
}
