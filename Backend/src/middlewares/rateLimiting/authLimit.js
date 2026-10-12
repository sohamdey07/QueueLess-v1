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
    max: 30, // Limit each IP to 30 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many token rotation attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

//forgot password rate limiting middleware
export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many password reset requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

//verify reset otp rate limiting middleware
export const verifyResetOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many OTP verification attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

//verify reset link rate limiting middleware
export const verifyResetLinkLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many reset link verification attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

//reset password rate limiting middleware
export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        statusCode: 429,
        message: "Too many password reset attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});



