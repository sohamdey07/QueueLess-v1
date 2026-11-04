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

const tvDisplayLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: "Too many TV display requests from this IP. Please slow down."
    }
});

export { staffQueueLimiter, tvDisplayLimiter };