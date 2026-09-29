import rateLimit from "express-rate-limit";

const bookAppointmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many appointment booking requests. Please try again later."
    }
});



const getAppointmentsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 100,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many appointment requests. Please try again later."
    }
});


const cancelAppointmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many appointment cancellation requests. Please try again later."
    }
});


export {
    bookAppointmentLimiter,
    getAppointmentsLimiter,
    cancelAppointmentLimiter,
};