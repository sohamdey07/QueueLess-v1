import { Server } from "socket.io";
import logger from "../utils/logger.js";
import registerSocketEvents from "./socket.events.js";
import socketAuth from "./socket.auth.js";
import config from "../config/env.js";

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: config.clientUrl,
            credentials: true
        }
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
        logger.info(
            {
                socketId: socket.id,
                userId: socket.user?.id
            },
            "Socket connected"
        );

        registerSocketEvents(io, socket);

        socket.on("disconnect", (reason) => {
            logger.info(
                {
                    socketId: socket.id,
                    reason
                },
                "Socket disconnected"
            );
        });
    });

    logger.info("Socket.IO initialized");

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

export {
    initializeSocket,
    getIO
};