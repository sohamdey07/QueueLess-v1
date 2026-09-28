

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return errorResponse(res, {
                statusCode: 403,
                message: "Access denied"
            });
        }

        next();
    };
};

export default authorizeRoles;