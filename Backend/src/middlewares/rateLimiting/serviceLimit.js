import rateLimit from "express-rate-limit";

export const createServiceLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many service creation requests. Please try again later."
    }
});

export const updateServiceLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many service update requests. Please try again later."
    }
});

export const deleteServiceLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many service deletion requests. Please try again later."
    }
});

export const getAllServiceLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later."
    }
});

export const getServiceByIdLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later."
    }
});