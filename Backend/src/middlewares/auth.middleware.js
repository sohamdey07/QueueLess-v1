import { verifyAccessToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Authentication required"
            });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Invalid authorization header"
            });
        }

        const decoded = verifyAccessToken(token);

        if (!decoded?.userId) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Invalid access token"
            });
        }

        req.user = decoded.id;

        next();

    } catch (error) {
        logger.error(error, "Authentication error");

        return errorResponse(res, {
            statusCode: 401,
            message: "Invalid or expired access token"
        });
    }
};

export default authenticate;