import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const staffQueueLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 120,

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        return req.user?.id || ipKeyGenerator(req.ip);
    },

    message: {
        success: false,
        message: "Too many queue operations. Please try again later."
    }
});

export {staffQueueLimiter};