import { getIO } from "../sockets/socket.js";

export const emitQueueUpdated = (queueId, data = {}) => {
    try {
        const io = getIO();
        const qIdStr = String(queueId);

        io.to(`queue:${qIdStr}`).emit("queue:updated", {
            queueId: qIdStr,
            ...data
        });

        // Also broadcast to TV displays
        io.to("tv:display").emit("tv:updated", {
            queueId: qIdStr,
            ...data
        });
    } catch (err) {
        // Socket may not be initialized in test contexts
    }
};

export const emitCounterUpdated = (counterId, data = {}) => {
    try {
        const io = getIO();
        io.to("tv:display").emit("tv:updated", {
            type: "COUNTER_UPDATED",
            counterId,
            ...data
        });
    } catch (err) {
        // Ignore
    }
};