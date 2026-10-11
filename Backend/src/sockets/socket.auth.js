import { verifyAccessToken } from "../utils/jwt.js";

const socketAuth = (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace("Bearer ", "");

        if (!token) {
            if (socket.handshake.auth?.isTvDisplay || socket.handshake.query?.clientType === "TV_DISPLAY") {
                socket.user = { role: "TV_DISPLAY" };
                return next();
            }
            return next(new Error("Authentication required"));
        }

        const decoded = verifyAccessToken(token);

        const userId = decoded?.userId || decoded?.id;

        if (!userId) {
            return next(new Error("Invalid access token"));
        }

        socket.user = {
            id: userId,
            role: decoded.role,
            email: decoded.email,
            sessionId: decoded.sessionId
        };

        next();

    } catch (error) {
        if (socket.handshake.auth?.isTvDisplay || socket.handshake.query?.clientType === "TV_DISPLAY") {
            socket.user = { role: "TV_DISPLAY" };
            return next();
        }
        next(new Error("Invalid or expired access token"));
    }
};

export default socketAuth;