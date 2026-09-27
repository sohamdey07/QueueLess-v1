import QueueEntry from "../src/models/queueEntry.model.js";

const registerSocketEvents = (io, socket) => {
    /*
     * ----------------------------------------
     * CUSTOMER - JOIN QUEUE
     * ----------------------------------------
     */

    socket.on("queue:join", async ({ queueId }) => {
        try {
            if (!queueId) {
                return socket.emit("socket:error", {
                    message: "Queue ID is required"
                });
            }

            if (socket.user.role !== "CUSTOMER") {
                return socket.emit("socket:error", {
                    message: "Only customers can join a queue"
                });
            }

            /*
             * Verify that this customer actually
             * belongs to this queue.
             */
            const queueEntry = await QueueEntry.findOne({
                queueId,
                customerId: socket.user.userId,
                status: {
                    $in: [
                        "WAITING",
                        "CALLED",
                        "IN_SERVICE"
                    ]
                }
            });

            if (!queueEntry) {
                return socket.emit("socket:error", {
                    message: "You are not a member of this queue"
                });
            }

            const room = `queue:${queueId}`;

            await socket.join(room);

            socket.emit("queue:joined", {
                queueId,
                queueEntryId: queueEntry._id,
                token: queueEntry.token,
                position: queueEntry.position,
                status: queueEntry.status
            });
        } catch (error) {
            socket.emit("socket:error", {
                message: "Failed to join queue"
            });
        }
    });

    /*
     * ----------------------------------------
     * CUSTOMER - LEAVE QUEUE
     * ----------------------------------------
     */

    socket.on("queue:leave", async ({ queueId }) => {
        try {
            if (!queueId) {
                return;
            }

            const room = `queue:${queueId}`;

            await socket.leave(room);

            socket.emit("queue:left", {
                queueId
            });
        } catch (error) {
            socket.emit("socket:error", {
                message: "Failed to leave queue"
            });
        }
    });

    /*
     * ----------------------------------------
     * STAFF / ADMIN - JOIN STAFF DASHBOARD
     * ----------------------------------------
     */

    socket.on("staff:join", async () => {
        try {
            if (
                socket.user.role !== "STAFF" &&
                socket.user.role !== "ADMIN"
            ) {
                return socket.emit("socket:error", {
                    message: "Unauthorized"
                });
            }

            const room = "staff:dashboard";

            await socket.join(room);

            socket.emit("staff:joined", {
                message: "Joined staff dashboard"
            });
        } catch (error) {
            socket.emit("socket:error", {
                message: "Failed to join staff dashboard"
            });
        }
    });

    /*
     * ----------------------------------------
     * STAFF / ADMIN - LEAVE DASHBOARD
     * ----------------------------------------
     */

    socket.on("staff:leave", async () => {
        try {
            await socket.leave("staff:dashboard");

            socket.emit("staff:left", {
                message: "Left staff dashboard"
            });
        } catch (error) {
            socket.emit("socket:error", {
                message: "Failed to leave staff dashboard"
            });
        }
    });

    /*
     * ----------------------------------------
     * DISCONNECT
     * ----------------------------------------
     */

    socket.on("disconnect", (reason) => {
        console.log(
            `Socket disconnected: ${socket.id}, reason: ${reason}`
        );
    });
};

export default registerSocketEvents;