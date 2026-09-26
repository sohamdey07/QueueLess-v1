import app from "./src/app.js";
import config from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import logger from "./src/utils/logger.js";
import {connectRedis} from "./src/config/redis.js";

const PORT = config.port;

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Error starting the server:", error);
        process.exit(1);
    }
}

startServer();
