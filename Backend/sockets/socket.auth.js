import { verifyAccessToken } from "../src/utils/jwt.js";

const socketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token is required"));
        }

        const decoded = verifyAccessToken(token);

        if (!decoded?.userId) {
            return next(new Error("Invalid authentication token"));
        }

        // Store authenticated user information
        // on the socket object.
        socket.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        next(new Error("Invalid or expired authentication token"));
    }
};

export default socketAuth;