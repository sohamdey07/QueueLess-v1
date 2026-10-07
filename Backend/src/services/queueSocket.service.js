import { getIO } from "../sockets/socket.js";

export const emitQueueUpdated = (queueId, data = {}) => {
    const io = getIO();

    io.to(`queue:${queueId}`).emit("queue:updated", {
        queueId,
        ...data
    });
};