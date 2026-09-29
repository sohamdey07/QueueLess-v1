import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import logger from "./utils/logger.js";
import errorMiddleware from "./middlewares/error.middleware.js";

import authRoutes from "./routes/auth.route.js";
import serviceRoutes from "./routes/service.route.js";
import availabilityRoutes from "./routes/availability.route.js";



const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet());

// Middleware for logging HTTP requests and responses
app.use(
    pinoHttp({
        logger,
        quietResLogger: true,

        customSuccessObject: () => ({}),
        customErrorObject: () => ({}),

        customSuccessMessage: (req, res, responseTime) =>
            `${req.method} ${req.originalUrl} | ${res.statusCode} | ${responseTime}ms`,

        customErrorMessage: (req, res, err, responseTime) =>
            `${req.method} ${req.originalUrl} | ${res.statusCode} | ${responseTime}ms - ${err.message}`,

        customLogLevel: (req, res) => {
            if (res.statusCode >= 500) {
                return "error";
            }

            if (res.statusCode >= 400) {
                return "warn";
            }

            return "info";
        },

        redact: [
            "req.headers.authorization",
            "req.headers.cookie"
        ]
    })
);


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/availability", availabilityRoutes);


// Error handling middleware
app.use(errorMiddleware);

export default app;