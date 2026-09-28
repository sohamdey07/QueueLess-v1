import { errorResponse } from "../utils/apiResponse.js";
import { verifyAccessToken } from "../utils/jwt.js";
import logger from "../utils/logger.js";

const authenticate = (req, res, next) => {
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
		const userId = decoded?.id || decoded?.userId;

		if (!userId) {
			return errorResponse(res, {
				statusCode: 401,
				message: "Invalid access token"
			});
		}

		req.user = {
			id: userId,
			role: decoded.role,
			email: decoded.email,
			sessionId: decoded.sessionId
		};

		return next();
	} catch (error) {
		logger.warn({
			error: error.message,
			method: req.method,
			url: req.originalUrl
		}, "Access token verification failed");

		errorResponse(res, {
            statusCode: 401,
            message: "Invalid or expired access token"
        });
	}
};

export default authenticate;
