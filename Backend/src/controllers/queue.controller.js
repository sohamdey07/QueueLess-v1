import mongoose from "mongoose";

import queueModel from "../models/queue.model.js";
import queueEntryModel from "../models/queueEntry.model.js";
import appointmentModel from "../models/appointment.model.js";
import counterModel from "../models/counter.model.js";
import serviceModel from "../models/service.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";
import { getTodayDate } from "../utils/date.js";

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
            .select("serviceId date currentToken nextToken status")
            .populate("serviceId", "name code duration description");

        if (!queue) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Queue not found"
            });
        }

        const service = queue.serviceId || {};
        const prefix = service.code || "T";

        // 2. Find customer's appointment for this queue
        const appointmentIdParam = req.query?.appointmentId;
        let appointment = null;

        if (appointmentIdParam) {
            appointment = await appointmentModel.findOne({
                appointmentId: appointmentIdParam,
                customerId: userId
            }).select("_id appointmentId status");
        }

        if (!appointment) {
            // Find active appointment (CHECKED_IN, IN_SERVICE) for this queue date, sorted newest first
            appointment = await appointmentModel.findOne({
                customerId: userId,
                serviceId: service._id,
                appointmentDate: queue.date,
                status: { $in: ["CHECKED_IN", "IN_SERVICE"] }
            })
            .sort({ createdAt: -1 })
            .select("_id appointmentId status");
        }

        if (!appointment) {
            // Fallback: newest appointment for this queue date
            appointment = await appointmentModel.findOne({
                customerId: userId,
                serviceId: service._id,
                appointmentDate: queue.date
            })
            .sort({ createdAt: -1 })
            .select("_id appointmentId status");
        }

        // 3. Find customer's queue entry
        let queueEntry = null;
        if (appointment) {
            queueEntry = await queueEntryModel.findOne({
                queueId: queue._id,
                appointmentId: appointment._id
            }).select(
                "tokenNumber token status counterId joinedAt calledAt servingAt completedAt"
            ).populate("counterId", "name code");
        }

        // If not found by direct match, fallback check through customer's appointments
        if (!queueEntry) {
            const customerAppointments = await appointmentModel.find({ customerId: userId }).select("_id appointmentId");
            const apptIds = customerAppointments.map(a => a._id);

            // Prioritize active waiting/called/serving entry, newest tokenNumber first!
            queueEntry = await queueEntryModel.findOne({
                queueId: queue._id,
                appointmentId: { $in: apptIds },
                status: { $in: ["WAITING", "CALLED", "SERVING"] }
            })
            .sort({ tokenNumber: -1, createdAt: -1 })
            .select(
                "tokenNumber token status counterId joinedAt calledAt servingAt completedAt"
            ).populate("counterId", "name code");

            if (!queueEntry) {
                queueEntry = await queueEntryModel.findOne({
                    queueId: queue._id,
                    appointmentId: { $in: apptIds }
                })
                .sort({ tokenNumber: -1, createdAt: -1 })
                .select(
                    "tokenNumber token status counterId joinedAt calledAt servingAt completedAt"
                ).populate("counterId", "name code");
            }
        }

        // 4. Calculate people before customer & format user token
        let peopleBeforeYou = 0;
        let formattedUserToken = null;
        if (queueEntry) {
            formattedUserToken = queueEntry.token || `${prefix}-${String(queueEntry.tokenNumber).padStart(3, "0")}`;
            if (queueEntry.status === "WAITING") {
                peopleBeforeYou = await queueEntryModel.countDocuments({
                    queueId: queue._id,
                    status: "WAITING",
                    tokenNumber: {
                        $lt: queueEntry.tokenNumber
                    }
                });
            }
        }

        // 5. Find all active counters for this service (up to 4 counters)
        const activeCounters = await counterModel.find({
            serviceId: service._id,
            isActive: true
        })
        .sort({ code: 1, name: 1 })
        .limit(4)
        .select("name code");

        const countersData = await Promise.all(
            activeCounters.map(async (cnt) => {
                const currentServingEntry = await queueEntryModel.findOne({
                    counterId: cnt._id,
                    status: { $in: ["CALLED", "SERVING"] }
                }).select("tokenNumber token status");

                const nowServingToken = currentServingEntry 
                    ? (currentServingEntry.token || `${prefix}-${String(currentServingEntry.tokenNumber).padStart(3, "0")}`)
                    : "—";

                return {
                    id: cnt._id,
                    counterId: cnt._id,
                    name: cnt.name,
                    code: cnt.code,
                    nowServing: nowServingToken,
                    status: currentServingEntry ? currentServingEntry.status : "IDLE"
                };
            })
        );

        return successResponse(res, {
            statusCode: 200,
            message: "Queue status retrieved successfully",
            data: {
                queue: {
                    id: queue._id,
                    serviceId: service._id,
                    serviceName: service.name || "Service",
                    serviceCode: prefix,
                    date: queue.date,
                    currentToken: queue.currentToken,
                    currentTokenFormatted: queue.currentToken > 0 ? `${prefix}-${String(queue.currentToken).padStart(3, "0")}` : "—",
                    nextToken: queue.nextToken,
                    status: queue.status
                },
                appointment: {
                    appointmentId: appointment?.appointmentId || "—"
                },
                queueEntry: queueEntry ? {
                    queueEntryId: queueEntry._id,
                    tokenNumber: queueEntry.tokenNumber,
                    token: formattedUserToken,
                    status: queueEntry.status,
                    counterId: queueEntry.counterId,
                    joinedAt: queueEntry.joinedAt,
                    calledAt: queueEntry.calledAt,
                    servingAt: queueEntry.servingAt,
                    completedAt: queueEntry.completedAt
                } : null,
                peopleBeforeYou,
                activeCounters: countersData
            }
        });

    } catch (error) {
        next(error);
    }
}

// function to get queue logs for admin
export async function getQueueLogs(req, res, next) {
    try {
        const { serviceId, date, status } = req.query;

        const filter = {};

        // Filter by service if provided and not "all"
        if (serviceId && serviceId !== "all") {
            if (mongoose.Types.ObjectId.isValid(serviceId)) {
                filter.serviceId = serviceId;
            }
        }

        // Filter by status if provided and not "all"
        if (status && status !== "all") {
            filter.status = status.toUpperCase();
        }

        // Filter by date if provided and not "all"
        if (date && date !== "all") {
            const matchingQueues = await queueModel.find({ date }).select("_id");
            const queueIds = matchingQueues.map((q) => q._id);

            const startOfDay = new Date(`${date}T00:00:00.000Z`);
            const endOfDay = new Date(`${date}T23:59:59.999Z`);

            if (!isNaN(startOfDay.getTime())) {
                filter.$or = [
                    { queueId: { $in: queueIds } },
                    { joinedAt: { $gte: startOfDay, $lte: endOfDay } }
                ];
            } else {
                filter.queueId = { $in: queueIds };
            }
        }

        // Fetch logs with populated details
        const logs = await queueEntryModel
            .find(filter)
            .sort({ joinedAt: -1, createdAt: -1 })
            .populate("serviceId", "name code")
            .populate("counterId", "name code")
            .populate("queueId", "date status currentToken nextToken")
            .populate("appointmentId", "appointmentId customerName customerEmail customerPhone status noShowAt checkedInAt completedAt");

        // Fetch distinct available dates across queues & appointments
        const [queueDates, appointmentDates] = await Promise.all([
            queueModel.distinct("date"),
            appointmentModel.distinct("appointmentDate")
        ]);

        const availableDates = Array.from(new Set([...queueDates, ...appointmentDates]))
            .filter(Boolean)
            .sort()
            .reverse();

        return successResponse(res, {
            statusCode: 200,
            message: "Queue logs retrieved successfully",
            data: {
                logs,
                availableDates
            }
        });

    } catch (error) {
        next(error);
    }
}

// function to get TV display queue snapshot for all counters
export async function getTvDisplayOverview(req, res, next) {
    try {
        const todayDate = getTodayDate();

        // 1. Find all active counters
        const counters = await counterModel.find({ isActive: true })
            .populate("serviceId", "name code")
            .populate("assignedStaffId", "name")
            .sort({ code: 1, name: 1 });

        const colorThemes = ["blue", "green", "purple", "orange"];

        // 2. Build live snapshot for each counter
        const countersData = await Promise.all(
            counters.map(async (counter, idx) => {
                const service = counter.serviceId || {};
                const prefix = service.code || "T";

                // Find active queue for this counter's service today
                const queue = await queueModel.findOne({
                    serviceId: service._id,
                    date: todayDate,
                    status: "ACTIVE"
                }).select("currentToken nextToken status");

                // Check if a customer is currently CALLED or SERVING at this counter
                const currentEntry = await queueEntryModel.findOne({
                    counterId: counter._id,
                    status: { $in: ["CALLED", "SERVING"] }
                }).select("tokenNumber status");

                let nowServing = "—";
                if (currentEntry) {
                    nowServing = `${prefix}-${String(currentEntry.tokenNumber).padStart(3, "0")}`;
                }

                // Get upcoming waiting tokens for this queue
                let upcomingTokens = [];
                if (queue) {
                    const waitingEntries = await queueEntryModel.find({
                        queueId: queue._id,
                        status: "WAITING"
                    })
                    .sort({ tokenNumber: 1 })
                    .limit(12)
                    .select("tokenNumber");

                    upcomingTokens = waitingEntries.map(
                        (e) => `${prefix}-${String(e.tokenNumber).padStart(3, "0")}`
                    );
                }

                return {
                    id: counter._id,
                    counterId: counter._id,
                    counterName: counter.name,
                    counterCode: counter.code,
                    serviceId: service._id,
                    serviceName: service.name || "Service",
                    tokenPrefix: prefix,
                    nowServing,
                    upcomingTokens,
                    colorTheme: colorThemes[idx % colorThemes.length],
                    queueId: queue?._id || null,
                    staffName: counter.assignedStaffId?.name || null
                };
            })
        );

        return successResponse(res, {
            statusCode: 200,
            message: "TV display overview retrieved successfully",
            data: countersData
        });

    } catch (error) {
        next(error);
    }
}

// function to get staff portal queue overview and today's metrics
export async function getStaffQueueOverview(req, res, next) {
    try {
        const staffId = req.user.id;
        const todayDate = getTodayDate();

        // 1. Find counter assigned to this staff member
        let counter = await counterModel.findOne({
            assignedStaffId: staffId
        }).populate("serviceId", "name code duration description");

        // If none assigned and user is ADMIN, fallback to the first active counter
        if (!counter && req.user.role === "ADMIN") {
            counter = await counterModel.findOne({ isActive: true })
                .populate("serviceId", "name code duration description");
        }

        if (!counter) {
            return successResponse(res, {
                statusCode: 200,
                message: "No counter currently assigned to this staff member",
                data: {
                    hasAssignedCounter: false,
                    counter: null,
                    queue: null,
                    currentCustomer: null,
                    waitingQueue: [],
                    stats: {
                        todayAppointments: 0,
                        capacity: 0,
                        alreadyServed: 0,
                        waiting: 0,
                        remaining: 0
                    }
                }
            });
        }

        const service = counter.serviceId || {};
        const prefix = service.code || "T";

        // 2. Find today's active queue for this service
        const queue = await queueModel.findOne({
            serviceId: service._id,
            date: todayDate,
            status: "ACTIVE"
        });

        // 3. Find currently active customer at this counter (CALLED or SERVING)
        const currentEntry = await queueEntryModel.findOne({
            counterId: counter._id,
            status: { $in: ["CALLED", "SERVING"] }
        }).populate("appointmentId", "appointmentId customerName customerPhone customerEmail status");

        // 4. Find all waiting queue entries for this queue
        let waitingQueue = [];
        if (queue) {
            const waitingEntries = await queueEntryModel.find({
                queueId: queue._id,
                status: "WAITING"
            })
            .sort({ tokenNumber: 1 })
            .populate("appointmentId", "appointmentId customerName customerPhone customerEmail status");

            waitingQueue = waitingEntries.map((e) => ({
                id: e._id,
                queueEntryId: e._id,
                tokenNumber: e.tokenNumber,
                token: `${prefix}-${String(e.tokenNumber).padStart(3, "0")}`,
                name: e.appointmentId?.customerName || "Customer",
                phone: e.appointmentId?.customerPhone || "—",
                email: e.appointmentId?.customerEmail || "—",
                appointmentId: e.appointmentId?.appointmentId || "—",
                joinedTime: e.joinedAt
                    ? new Date(e.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Today"
            }));
        }

        // 5. Calculate summary metrics
        const startOfDay = new Date(`${todayDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${todayDate}T23:59:59.999Z`);

        const [todayAppointments, availability, alreadyServed] = await Promise.all([
            appointmentModel.countDocuments({
                serviceId: service._id,
                appointmentDate: todayDate,
                status: { $ne: "CANCELLED" }
            }),
            availabilityModel.findOne({
                serviceId: service._id,
                date: todayDate
            }),
            queueEntryModel.countDocuments({
                serviceId: service._id,
                status: "COMPLETED",
                $or: [
                    ...(queue ? [{ queueId: queue._id }] : []),
                    { completedAt: { $gte: startOfDay, $lte: endOfDay } }
                ]
            })
        ]);

        const capacity = availability?.capacity || Math.max(todayAppointments, 30);
        const remaining = Math.max(0, capacity - alreadyServed);

        return successResponse(res, {
            statusCode: 200,
            message: "Staff queue overview retrieved successfully",
            data: {
                hasAssignedCounter: true,
                counter: {
                    id: counter._id,
                    name: counter.name,
                    code: counter.code,
                    isActive: counter.isActive,
                    service
                },
                queue: queue ? {
                    id: queue._id,
                    date: queue.date,
                    currentToken: queue.currentToken,
                    nextToken: queue.nextToken,
                    status: queue.status
                } : null,
                currentCustomer: currentEntry ? {
                    queueEntryId: currentEntry._id,
                    tokenNumber: currentEntry.tokenNumber,
                    token: `${prefix}-${String(currentEntry.tokenNumber).padStart(3, "0")}`,
                    name: currentEntry.appointmentId?.customerName || "Customer",
                    phone: currentEntry.appointmentId?.customerPhone || "—",
                    email: currentEntry.appointmentId?.customerEmail || "—",
                    appointmentId: currentEntry.appointmentId?.appointmentId || "—",
                    joinedTime: currentEntry.joinedAt
                        ? new Date(currentEntry.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Today",
                    status: currentEntry.status,
                    calledAt: currentEntry.calledAt,
                    servingAt: currentEntry.servingAt
                } : null,
                waitingQueue,
                stats: {
                    todayAppointments,
                    capacity,
                    alreadyServed,
                    waiting: waitingQueue.length,
                    remaining
                }
            }
        });

    } catch (error) {
        next(error);
    }
}