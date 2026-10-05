import { verifyAccessToken } from "../utils/jwt.js"
import { errorResponse } from "../utils/apiResponse.js"
import logger from "../utils/logger.js"


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
		console.log("Decoded token:", decoded); // Debugging line

        if (!decoded?.id || !decoded?.role) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Invalid access token"
            });
        }

        req.user = {
            id: decoded.userId,
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