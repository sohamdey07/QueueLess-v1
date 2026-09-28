
import { errorResponse } from "../utils/apiResponse.js";

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, {
                statusCode: 401,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return errorResponse(res, {
                statusCode: 403,
                message: "Access denied"
            });
        }

        next();
    };
};

export { authorizeRoles };