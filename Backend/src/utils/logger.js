import pino from "pino";
import config from "../config/env.js";

const logger = pino({
  level: config.logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      messageFormat: "{msg}",
      translateTime: "SYS:standard"}
    }
}); 

export default logger;