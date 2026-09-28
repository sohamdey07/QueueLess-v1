import rateLimit from "express-rate-limit";


//register rate limiting middleware
export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many registration attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//verify account rate limiting middleware
export const verifyAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many verification attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//login rate limiting middleware
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many login attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//rotate token rate limiting middleware
export const rotateTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 10 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many token rotation attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});



