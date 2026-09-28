import { errorResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

const errorMiddleware = (error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	const isProduction = process.env.NODE_ENV === "production";
	let statusCode = error.statusCode || error.status || 500;
	let message = error.message || "Internal server error";
	let errors = error.errors || null;

	if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
		statusCode = 400;
		message = "Invalid JSON payload";
		errors = null;
	}
    else if (error.name === "ValidationError") {
		statusCode = 400;
		message = "Validation failed";
		errors = Object.values(error.errors).map((validationError) => ({
			field: validationError.path,
			message: validationError.message
		}));
	}
    else if (error.name === "CastError") {
		statusCode = 400;
		message = "Invalid resource identifier";
		errors = null;
	}
    else if (error.code === 11000) {
		statusCode = 409;
		message = "A resource with these details already exists";
		errors = null;
	}
    else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
		statusCode = 401;
		message = "Invalid or expired authentication token";
		errors = null;
	}

	if (statusCode < 400 || statusCode > 599) {
		statusCode = 500;
	}

	if (statusCode >= 500) {
		(req.log || logger).error(
            { 
                err: error,
                method:req.method,
                url:req.originalUrl,
            }, 
            "Unhandled application error");
		message = isProduction ? "Internal server error" : message;
		errors = isProduction ? null : errors;
	}

	return errorResponse(res, { statusCode, message, errors });
};

export default errorMiddleware;
