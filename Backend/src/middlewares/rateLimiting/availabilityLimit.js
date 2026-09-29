import rateLimit from "express-rate-limit";

const createAvailabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        status: 429,
        message: "Too many availability creation requests. Please try again later."
    }
});


const getAvailabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        status: 429,
        message: "Too many availability requests. Please try again later."
    }
});


const updateAvailabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        status: 429,
        message: "Too many availability update requests. Please try again later."
    }
});


const deleteAvailabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        status: 429,
        message: "Too many availability deletion requests. Please try again later."
    }
});


export {
    createAvailabilityLimiter,
    getAvailabilityLimiter,
    updateAvailabilityLimiter,
    deleteAvailabilityLimiter
};