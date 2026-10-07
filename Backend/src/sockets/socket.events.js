import mongoose from "mongoose";

import queueModel from "../models/queue.model.js";
import appointmentModel from "../models/appointment.model.js";
import queueEntryModel from "../models/queueEntry.model.js";

const registerSocketEvents = (io, socket) => {

    socket.on("queue:join", async (payload = {}) => {
        try {
            const { queueId } = payload;

            if (socket.user?.role !== "CUSTOMER") {
                return socket.emit("queue:error", {
                    message: "Only customers can join a queue"
                });
            }

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

            if (queue.status !== "ACTIVE") {
                return socket.emit("queue:error", {
                    message: "This queue is closed"
                });
            }

            // 3. Find customer's appointment for this queue
            const appointment = await appointmentModel
                .findOne({
                    customerId: socket.user.id,
                    serviceId: queue.serviceId,
                    appointmentDate: queue.date
                })
                .select("_id appointmentId");

            if (!appointment) {
                return socket.emit("queue:error", {
                    message: "You are not authorized to join this queue"
                });
            }

            // 4. Verify that the customer actually joined this queue
            const queueEntry = await queueEntryModel
                .findOne({
                    queueId: queue._id,
                    appointmentId: appointment._id,
                    status: {
                        $in: ["WAITING", "CALLED", "SERVING"]
                    }
                })
                .select("_id tokenNumber status");

            if (!queueEntry) {
                return socket.emit("queue:error", {
                    message: "You have not joined this queue"
                });
            }

            // 5. Join Socket.IO room
            await socket.join(`queue:${queue._id}`);

            // 6. Confirm successful join
            socket.emit("queue:joined", {
                queueId: queue._id,
                queueEntryId: queueEntry._id,
                tokenNumber: queueEntry.tokenNumber,
                status: queueEntry.status
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

            await socket.leave(`queue:${queueId}`);

        } catch (error) {
            // Ignore leave errors
        }
    });
};

export default registerSocketEvents;