import { rateLimit } from "express-rate-limit";

const userReadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many user read requests. Please try again later."
    }
});

const userUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many user update requests. Please try again later."
    }
});

const userDeleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many user deletion requests. Please try again later."
    }
});

export {
    userReadLimiter,
    userUpdateLimiter,
    userDeleteLimiter
};
