import { z } from "zod";

const createAvailabilitySchema = z.object({
    date: z
        .string()
        .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "Date must be in YYYY-MM-DD format"
        ),

    capacity: z
        .number({
            error: "Capacity must be a number"
        })
        .int("Capacity must be an integer")
        .min(1, "Capacity must be at least 1")
});


const updateAvailabilitySchema = z.object({
     date: z
        .string()
        .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "Date must be in YYYY-MM-DD format"
        )
        .optional(),
        
    capacity: z
        .number({
            error: "Capacity must be a number"
        })
        .int("Capacity must be an integer")
        .min(1, "Capacity must be at least 1")
        .optional(),

    status: z
        .enum(
            ["OPEN", "CLOSED", "FULL"],
            {
                error: "Status must be OPEN, CLOSED, or FULL"
            }
        )
        .optional()
});


const availabilityParamsSchema = z.object({
    availabilityId: z
        .string()
        .min(1, "Availability ID is required")
});


const serviceAvailabilityParamsSchema = z.object({
    serviceId: z
        .string()
        .min(1, "Service ID is required")
});


export {
    createAvailabilitySchema,
    updateAvailabilitySchema,
    availabilityParamsSchema,
    serviceAvailabilityParamsSchema
};