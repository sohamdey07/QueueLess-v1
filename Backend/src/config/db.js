import mongoose from "mongoose";
import dns from "dns";
import config from "./env.js";
import logger from "../utils/logger.js";

async function connectDB() {
    try {
        dns.setServers(["8.8.8.8","1.1.1.1"]);
        // Check if the MongoDB URI is valid
        const uri = config.mongodbUri;
        if (!uri) {
            throw new Error("MongoDB URI not found in environment variables.");
        }
        await mongoose.connect(uri,{
                maxPoolSize: 50,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                waitQueueTimeoutMS: 10000
        });
        logger.info("Connected to MongoDB successfully.");
    }
    catch (error) {
        logger.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export { connectDB };