import cron from "node-cron";

import {
    processNoShowAppointments
} from "./appointmentExpiry.service.js";

import logger from "../utils/logger.js";


const startCronJobs = () => {

    cron.schedule(
        "5 0 * * *",
        async () => {

            logger.info(
                "No-show cron started"
            );

            try {
                await processNoShowAppointments();

            } catch (error) {

                logger.error(
                    {
                        err: error
                    },
                    "No-show cron failed"
                );
            }
        },
        {
            timezone: "Asia/Kolkata"
        }
    );

    logger.info(
        "Cron jobs initialized"
    );
};

export default startCronJobs;