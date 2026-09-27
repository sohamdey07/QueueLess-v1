import { Server } from "socket.io";

import socketAuth from "./socket.auth.js";
import registerSocketEvents from "./socket.events.js";

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    /*
     * Authenticate every socket connection
     */
    io.use(socketAuth);

    /*
     * Handle new connections
     */
    io.on("connection", (socket) => {
        console.log(
            `Socket connected: ${socket.id}`
        );

        console.log(
            `User: ${socket.user.userId}, Role: ${socket.user.role}`
        );

        registerSocketEvents(io, socket);
    });

    return io;
};

export  {initializeSocket};