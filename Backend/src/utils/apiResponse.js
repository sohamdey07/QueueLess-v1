const successResponse = (
    res,
    {
        statusCode = 200,
        message = "Success",
        data = null,
        meta = null
    } = {}
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta && { meta })
    });
};

const errorResponse = (
    res,
    {
        statusCode = 500,
        message = "Internal server error",
        errors = null
    } = {}
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors })
    });
};

export {
    successResponse,
    errorResponse
};