import { verifyAccessToken } from "../utils/jwt.js"
import { errorResponse } from "../utils/apiResponse.js"
import logger from "../utils/logger.js"
import mongoose from "mongoose";


function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return errorResponse(res, {
            statusCode: 401,
            message: "Authentication required. Provide a Bearer access token."
        });
    }

    const [scheme, token] = authHeader.trim().split(/\s+/);

    if (scheme !== "Bearer" || !token) {
        return errorResponse(res, {
            statusCode: 401,
            message: "Invalid authorization header. Use Bearer <access_token>."
        });
    }

    try {
        const decoded = verifyAccessToken(token);

        if (
            !decoded?.id ||
            !decoded?.role ||
            !mongoose.isValidObjectId(decoded.id)
        ) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Invalid access token"
            });
        }

        req.user = {
            id: decoded.id.toString(),
            role: decoded.role,
            email: decoded.email,
            sessionId: decoded.sessionId
        };

        return next();

    } catch (error) {
        logger.warn(
            {
                error: error.message,
                method: req.method,
                url: req.originalUrl
            },
            "Access token verification failed"
        );

        return errorResponse(res, {
            statusCode: 401,
            message: "Invalid or expired access token"
        });
    }
};


export default authenticate;