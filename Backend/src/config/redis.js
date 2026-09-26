import {createClient} from 'redis';
import config from "./env.js";
import logger from "../utils/logger.js";

const redisClient = createClient({
  url: config.redisUrl
});

redisClient.on("connect", () => {
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis connected successfully");
});

redisClient.on("error", (error) => {
  logger.error("Redis error:", error);
});

redisClient.on("reconnecting", () => {
  logger.info("Redis reconnecting...");
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error("Redis connection failed:", error);
    process.exit(1);
  }
};

export { redisClient, connectRedis };