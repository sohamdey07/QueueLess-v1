import mongoose from "mongoose";

import queueModel from "../models/queue.model.js";
import queueEntryModel from "../models/queueEntry.model.js";
import appointmentModel from "../models/appointment.model.js";
import counterModel from "../models/counter.model.js";

import { successResponse, errorResponse } from "../utils/apiResponse.js";

import {
    callNextCustomerService,
    skipQueueEntryService,
    startQueueEntryService,
    completeQueueEntryService
} from "../services/queue.service.js";


// function to call the next customer in the queue
export async function callNextCustomer(req, res, next) {
    try {
        const result = await callNextCustomerService({
            queueId: req.params.queueId,
            staffId: req.user.id
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Next customer called successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

// function to skip a queue entry
export async function skipQueueEntry(req, res, next) {
   try {
        const result = await skipQueueEntryService({
            queueEntryId: req.params.queueEntryId,
            staffId: req.user.id
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Customer skipped successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

// function to start the service for a queue entry
export async function startQueueService(req, res, next) {
    try {
        const result = await startQueueEntryService({
            queueEntryId: req.params.queueEntryId,
            staffId: req.user.id
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Service started successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

// function to complete the service for a queue entry
export async function completeQueueService(req, res, next) {
    try {
        const result = await completeQueueEntryService({
            queueEntryId: req.params.queueEntryId,
            staffId: req.user.id
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Service completed successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}


//function to get current queue status
export async function getQueueStatus(req, res, next) {
    try {
        const { queueId } = req.params;
        const userId = req.user.id;

        // 1. Find queue
        const queue = await queueModel
            .findById(queueId)
            .select("serviceId date currentToken nextToken status");

        if (!queue) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Queue not found"
            });
        }

        // 2. Find customer's appointment for this queue
        const appointment = await appointmentModel.findOne({
            customerId: userId,
            serviceId: queue.serviceId,
            appointmentDate: queue.date
        }).select("_id appointmentId");

        if (!appointment) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Appointment not found for this queue"
            });
        }

        // 3. Find customer's queue entry
        const queueEntry = await queueEntryModel.findOne({
            queueId: queue._id,
            appointmentId: appointment._id,
            serviceId: queue.serviceId
        }).select(
            "tokenNumber status counterId joinedAt calledAt servingAt completedAt"
        );

        if (!queueEntry) {
            return errorResponse(res, {
                statusCode: 404,
                message: "You have not joined this queue"
            });
        }

        // 4. Calculate people before customer
        let peopleBeforeYou = 0;

        if (queueEntry.status === "WAITING") {
            peopleBeforeYou = await queueEntryModel.countDocuments({
                queueId: queue._id,
                status: "WAITING",
                tokenNumber: {
                    $lt: queueEntry.tokenNumber
                }
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Queue status retrieved successfully",
            data: {
                queue: {
                    id: queue._id,
                    serviceId: queue.serviceId,
                    date: queue.date,
                    currentToken: queue.currentToken,
                    nextToken: queue.nextToken,
                    status: queue.status
                },
                appointment: {
                    appointmentId: appointment.appointmentId
                },
                queueEntry: {
                    queueEntryId: queueEntry._id,
                    tokenNumber: queueEntry.tokenNumber,
                    status: queueEntry.status,
                    counterId: queueEntry.counterId,
                    joinedAt: queueEntry.joinedAt,
                    calledAt: queueEntry.calledAt,
                    servingAt: queueEntry.servingAt,
                    completedAt: queueEntry.completedAt
                },
                peopleBeforeYou
            }
        });

    } catch (error) {
        next(error);
    }
}