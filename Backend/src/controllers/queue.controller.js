import mongoose from "mongoose";

import queueModel from "../models/queue.model.js";
import queueEntryModel from "../models/queueEntry.model.js";
import appointmentModel from "../models/appointment.model.js";
import counterModel from "../models/counter.model.js";

import { successResponse, errorResponse } from "../utils/apiResponse.js";


// function to call the next customer in the queue
export async function callNextCustomer(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const { queueId } = req.params;
        const staffId = req.user.id;

        let result;

        await session.withTransaction(async () => {

            // --------------------------------------------------
            // 1. Check queue
            // --------------------------------------------------

            const queue = await queueModel.findOne({
                _id: queueId,
                status: "ACTIVE"
            }).session(session);

            if (!queue) {
                const error = new Error("Queue not found or is closed");
                error.statusCode = 404;
                throw error;
            }


            // --------------------------------------------------
            // 2. Find counter assigned to this staff member
            // --------------------------------------------------

            const counter = await counterModel.findOne({
                assignedStaffId: staffId,
                isActive: true
            }).session(session);

            if (!counter) {
                const error = new Error(
                    "No active counter is assigned to this staff member"
                );
                error.statusCode = 403;
                throw error;
            }


            // --------------------------------------------------
            // 3. Check whether this counter is already occupied
            // --------------------------------------------------

            const activeEntry = await queueEntryModel.findOne({
                counterId: counter._id,
                status: {
                    $in: ["CALLED", "SERVING"]
                }
            }).session(session);

            if (activeEntry) {
                const error = new Error(
                    "This counter is currently serving another customer"
                );
                error.statusCode = 409;
                throw error;
            }


            // --------------------------------------------------
            // 4. Get next waiting customer
            // --------------------------------------------------

            const nextEntry = await queueEntryModel
                .findOne({
                    queueId: queue._id,
                    status: "WAITING"
                })
                .sort({ tokenNumber: 1 })
                .session(session);

            if (!nextEntry) {
                const error = new Error(
                    "No customers are currently waiting in the queue"
                );
                error.statusCode = 404;
                throw error;
            }


            // --------------------------------------------------
            // 5. Atomically change WAITING → CALLED
            // --------------------------------------------------

            const calledAt = new Date();

            const updatedEntry =
                await queueEntryModel.findOneAndUpdate(
                    {
                        _id: nextEntry._id,
                        queueId: queue._id,
                        status: "WAITING"
                    },
                    {
                        $set: {
                            status: "CALLED",
                            counterId: counter._id,
                            calledAt
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!updatedEntry) {
                const error = new Error(
                    "Unable to call the next customer"
                );
                error.statusCode = 409;
                throw error;
            }


            // --------------------------------------------------
            // 6. Update queue current token
            // --------------------------------------------------

            await queueModel.findOneAndUpdate(
                {
                    _id: queue._id,
                    currentToken: {
                        $lt: updatedEntry.tokenNumber
                    }
                },
                {
                    $set: {
                        currentToken: updatedEntry.tokenNumber
                    }
                },
                {
                    session
                }
            );


            // --------------------------------------------------
            // 7. Prepare response
            // --------------------------------------------------

            const appointment = await appointmentModel
                .findById(updatedEntry.appointmentId)
                .select(
                    "appointmentId customerName customerEmail customerPhone serviceId"
                )
                .session(session);

            result = {
                queueId: queue._id,
                queueEntryId: updatedEntry._id,
                tokenNumber: updatedEntry.tokenNumber,
                counterId: counter._id,
                counterName: counter.name,
                counterCode: counter.code,
                status: updatedEntry.status,
                calledAt: updatedEntry.calledAt,
                appointment
            };
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Next customer called successfully",
            data: result
        });

    } catch (error) {

        // Counter already has an active customer
        if (error?.code === 11000) {
            return errorResponse(res, {
                statusCode: 409,
                message: "This counter is already serving another customer"
            });
        }

        next(error);

    } finally {
        await session.endSession();
    }
}

// function to skip a queue entry
export async function skipQueueEntry(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const { queueEntryId } = req.params;
        const staffId = req.user.id;

        let result;

        await session.withTransaction(async () => {

            // --------------------------------------------------
            // 1. Find staff's active counter
            // --------------------------------------------------

            const counter = await counterModel.findOne({
                assignedStaffId: staffId,
                isActive: true
            }).session(session);

            if (!counter) {
                const error = new Error(
                    "No active counter is assigned to this staff member"
                );
                error.statusCode = 403;
                throw error;
            }


            // --------------------------------------------------
            // 2. Find called queue entry assigned to this counter
            // --------------------------------------------------

            const queueEntry = await queueEntryModel.findOne({
                _id: queueEntryId,
                counterId: counter._id,
                status: "CALLED"
            }).session(session);

            if (!queueEntry) {
                const error = new Error(
                    "Called queue entry not found for this counter"
                );
                error.statusCode = 404;
                throw error;
            }


            // --------------------------------------------------
            // 3. Change CALLED → SKIPPED
            // --------------------------------------------------

            const updatedEntry =
                await queueEntryModel.findOneAndUpdate(
                    {
                        _id: queueEntry._id,
                        counterId: counter._id,
                        status: "CALLED"
                    },
                    {
                        $set: {
                            status: "SKIPPED",
                            counterId: null
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!updatedEntry) {
                const error = new Error(
                    "Unable to skip this queue entry"
                );
                error.statusCode = 409;
                throw error;
            }


            // --------------------------------------------------
            // 4. Update appointment
            // --------------------------------------------------

            const appointment =
                await appointmentModel.findOneAndUpdate(
                    {
                        _id: updatedEntry.appointmentId,
                        status: "CHECKED_IN"
                    },
                    {
                        $set: {
                            status: "NO_SHOW",
                            noShowAt: new Date()
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            result = {
                queueEntryId: updatedEntry._id,
                tokenNumber: updatedEntry.tokenNumber,
                status: updatedEntry.status,
                counterId: counter._id,
                appointmentId: appointment?.appointmentId || null
            };
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Customer skipped successfully",
            data: result
        });

    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
}

// function to start the service for a queue entry
export async function startQueueService(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const { queueEntryId } = req.params;
        const staffId = req.user.id;

        let result;

        await session.withTransaction(async () => {

            const counter = await counterModel.findOne({
                assignedStaffId: staffId,
                isActive: true
            }).session(session);

            if (!counter) {
                const error = new Error(
                    "No active counter is assigned to this staff member"
                );
                error.statusCode = 403;
                throw error;
            }

            const queueEntry = await queueEntryModel.findOne({
                _id: queueEntryId,
                counterId: counter._id,
                status: "CALLED"
            }).session(session);

            if (!queueEntry) {
                const error = new Error(
                    "Called queue entry not found for this counter"
                );
                error.statusCode = 404;
                throw error;
            }

            const servingAt = new Date();

            const updatedEntry =
                await queueEntryModel.findOneAndUpdate(
                    {
                        _id: queueEntry._id,
                        counterId: counter._id,
                        status: "CALLED"
                    },
                    {
                        $set: {
                            status: "SERVING",
                            servingAt
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!updatedEntry) {
                const error = new Error(
                    "Unable to start service for this customer"
                );
                error.statusCode = 409;
                throw error;
            }

            const appointment =
                await appointmentModel.findOneAndUpdate(
                    {
                        _id: updatedEntry.appointmentId,
                        status: "CHECKED_IN"
                    },
                    {
                        $set: {
                            status: "IN_SERVICE"
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!appointment) {
                const error = new Error(
                    "Appointment cannot be moved to IN_SERVICE"
                );
                error.statusCode = 409;
                throw error;
            }

            result = {
                queueEntryId: updatedEntry._id,
                appointmentId: appointment.appointmentId,
                tokenNumber: updatedEntry.tokenNumber,
                counterId: counter._id,
                status: updatedEntry.status,
                servingAt: updatedEntry.servingAt
            };
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Service started successfully",
            data: result
        });

    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
}

// function to complete the service for a queue entry
export async function completeQueueService(req, res, next) {
    const session = await mongoose.startSession();

    try {
        const { queueEntryId } = req.params;
        const staffId = req.user.id;

        let result;

        await session.withTransaction(async () => {

            const counter = await counterModel.findOne({
                assignedStaffId: staffId,
                isActive: true
            }).session(session);

            if (!counter) {
                const error = new Error(
                    "No active counter is assigned to this staff member"
                );
                error.statusCode = 403;
                throw error;
            }

            const queueEntry = await queueEntryModel.findOne({
                _id: queueEntryId,
                counterId: counter._id,
                status: "SERVING"
            }).session(session);

            if (!queueEntry) {
                const error = new Error(
                    "Serving queue entry not found for this counter"
                );
                error.statusCode = 404;
                throw error;
            }

            const completedAt = new Date();

            const updatedEntry =
                await queueEntryModel.findOneAndUpdate(
                    {
                        _id: queueEntry._id,
                        counterId: counter._id,
                        status: "SERVING"
                    },
                    {
                        $set: {
                            status: "COMPLETED",
                            completedAt,
                            counterId: null
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!updatedEntry) {
                const error = new Error(
                    "Unable to complete this service"
                );
                error.statusCode = 409;
                throw error;
            }

            const appointment =
                await appointmentModel.findOneAndUpdate(
                    {
                        _id: updatedEntry.appointmentId,
                        status: "IN_SERVICE"
                    },
                    {
                        $set: {
                            status: "COMPLETED",
                            completedAt
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!appointment) {
                const error = new Error(
                    "Appointment cannot be marked as completed"
                );
                error.statusCode = 409;
                throw error;
            }

            result = {
                queueEntryId: updatedEntry._id,
                appointmentId: appointment.appointmentId,
                tokenNumber: updatedEntry.tokenNumber,
                counterId: counter._id,
                status: updatedEntry.status,
                completedAt
            };
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Service completed successfully",
            data: result
        });

    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
}