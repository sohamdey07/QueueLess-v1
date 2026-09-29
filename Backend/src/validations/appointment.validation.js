import { z } from "zod";

const createAppointmentSchema = z.object({
    serviceId: z
        .string()
        .min(1, "Service ID is required"),

     availabilityId: z
        .string()
        .min(1, "Availability ID is required")
});

const appointmentParamsSchema = z.object({
    appointmentId: z
        .string()
        .min(1, "Appointment ID is required")
});



export {
    createAppointmentSchema,
    appointmentParamsSchema,
};