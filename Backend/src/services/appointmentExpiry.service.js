import mongoose from "mongoose";

import appointmentModel from "../models/appointment.model.js";
import availabilityModel from "../models/dailyAvailability.model.js";

import { getTodayDate } from "../utils/date.js";
import logger from "../utils/logger.js";


export async function processNoShowAppointments() {
    const today = getTodayDate();

    /*
     * Find appointments that:
     * 1. Were booked
     * 2. Appointment date has already passed
     *
     * Example:
     *
     * appointmentDate = 2026-10-04
     * today           = 2026-10-05
     *
     * → NO_SHOW
     */
    const appointments = await appointmentModel.find({
        status: "BOOKED",
        appointmentDate: {
            $lt: today
        }
    }).select("_id appointmentId serviceId appointmentDate");

    if (appointments.length === 0) {
        logger.info("No-show cron: no appointments to process");
        return {
            processed: 0,
            skipped: 0
        };
    }

    let processed = 0;
    let skipped = 0;

    for (const appointment of appointments) {
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                /*
                 * Re-check the appointment inside the transaction.
                 *
                 * This prevents processing an appointment that may have
                 * been checked in/cancelled after the initial query.
                 */
                const currentAppointment =
                    await appointmentModel.findOne({
                        _id: appointment._id,
                        status: "BOOKED",
                        appointmentDate: {
                            $lt: today
                        }
                    }).session(session);

                /*
                 * Another process may have already handled it.
                 */
                if (!currentAppointment) {
                    skipped++;
                    return;
                }

                /*
                 * Find the availability associated with this appointment.
                 */
                const availability =
                    await availabilityModel.findOne({
                        serviceId: currentAppointment.serviceId,
                        date: currentAppointment.appointmentDate
                    }).session(session);

                if (availability) {
                    /*
                     * Release the reservation from bookedCount.
                     *
                     * This keeps the availability statistics accurate.
                     */
                    if (availability.bookedCount > 0) {
                        availability.bookedCount -= 1;
                    }

                    /*
                     * IMPORTANT:
                     *
                     * The appointment date has already passed.
                     *
                     * Therefore, do NOT change FULL → OPEN.
                     *
                     * The availability is historical and should not become
                     * bookable again.
                     */
                    await availability.save({
                        session
                    });
                } else {
                    /*
                     * Availability may have been removed during historical
                     * data cleanup. The appointment still needs a terminal
                     * status so the cron does not retry it forever.
                     */
                    logger.warn(
                        {
                            appointmentId:
                                currentAppointment.appointmentId,
                            serviceId:
                                currentAppointment.serviceId,
                            appointmentDate:
                                currentAppointment.appointmentDate
                        },
                        "Availability not found while marking appointment as NO_SHOW"
                    );
                }

                /*
                 * Mark appointment as NO_SHOW.
                 */
                currentAppointment.status = "NO_SHOW";
                currentAppointment.noShowAt = new Date();

                await currentAppointment.save({
                    session
                });

                processed++;

                logger.info(
                    {
                        appointmentId:
                            currentAppointment.appointmentId,
                        appointmentDate:
                            currentAppointment.appointmentDate
                    },
                    "Appointment marked as NO_SHOW"
                );
            });

        } catch (error) {

            logger.error(
                {
                    err: error,
                    appointmentId: appointment.appointmentId
                },
                "Failed to process no-show appointment"
            );

        } finally {
            await session.endSession();
        }
    }

    logger.info(
        {
            processed,
            skipped
        },
        "No-show cron completed"
    );

    return {
        processed,
        skipped
    };
}