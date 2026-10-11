import mongoose from "mongoose";

import queueModel from "../models/queue.model.js";
import appointmentModel from "../models/appointment.model.js";
import queueEntryModel from "../models/queueEntry.model.js";

const registerSocketEvents = (io, socket) => {

    socket.on("queue:join", async (payload = {}) => {
        try {
            const { queueId } = payload;

            // 1. Validate queueId
            if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
                return socket.emit("queue:error", {
                    message: "Invalid queue ID"
                });
            }

            // 2. Find queue
            const queue = await queueModel
                .findById(queueId)
                .select("serviceId date status");

            if (!queue) {
                return socket.emit("queue:error", {
                    message: "Queue not found"
                });
            }

            // Join Socket.IO room for live queue broadcast updates
            await socket.join(`queue:${String(queue._id)}`);

            // Lookup customer's queue entry in this queue if customer
            let userQueueEntry = null;
            if (socket.user?.id) {
                const { appointmentId } = payload;
                if (appointmentId) {
                    const specificAppt = await appointmentModel.findOne({
                        appointmentId,
                        customerId: socket.user.id
                    }).select("_id");
                    if (specificAppt) {
                        userQueueEntry = await queueEntryModel.findOne({
                            queueId: queue._id,
                            appointmentId: specificAppt._id
                        }).select("_id tokenNumber token status");
                    }
                }

                if (!userQueueEntry) {
                    const customerAppointments = await appointmentModel.find({ customerId: socket.user.id }).select("_id");
                    const apptIds = customerAppointments.map(a => a._id);

                    // Prioritize active waiting/called/serving entry, newest tokenNumber first!
                    userQueueEntry = await queueEntryModel
                        .findOne({
                            queueId: queue._id,
                            appointmentId: { $in: apptIds },
                            status: { $in: ["WAITING", "CALLED", "SERVING"] }
                        })
                        .sort({ tokenNumber: -1, createdAt: -1 })
                        .select("_id tokenNumber token status");

                    if (!userQueueEntry) {
                        userQueueEntry = await queueEntryModel
                            .findOne({
                                queueId: queue._id,
                                appointmentId: { $in: apptIds }
                            })
                            .sort({ tokenNumber: -1, createdAt: -1 })
                            .select("_id tokenNumber token status");
                    }
                }
            }

            // Confirm successful join
            socket.emit("queue:joined", {
                queueId: queue._id,
                queueEntryId: userQueueEntry?._id || null,
                tokenNumber: userQueueEntry?.tokenNumber || null,
                token: userQueueEntry?.token || null,
                queueStatus: queue.status,
                status: userQueueEntry?.status || null
            });

        } catch (error) {
            socket.emit("queue:error", {
                message: "Unable to join queue"
            });
        }
    });


    socket.on("queue:leave", async (payload = {}) => {
        try {
            const { queueId } = payload;

            if (!queueId || !mongoose.Types.ObjectId.isValid(queueId)) {
                return;
            }

            await socket.leave(`queue:${String(queueId)}`);

        } catch (error) {
            // Ignore leave errors
        }
    });

    socket.on("tv:join", async () => {
        try {
            await socket.join("tv:display");
            socket.emit("tv:joined", { message: "Joined TV display channel" });
        } catch (error) {
            socket.emit("tv:error", { message: "Unable to join TV display channel" });
        }
    });

    socket.on("tv:leave", async () => {
        try {
            await socket.leave("tv:display");
        } catch (error) {
            // Ignore
        }
    });
};

export default registerSocketEvents;