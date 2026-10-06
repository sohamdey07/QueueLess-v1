import { z } from "zod";

const createCounterSchema = z.object({
    name: z
        .string({ error: "Counter name is required" })
        .trim()
        .min(1, "Counter name is required")
        .max(100, "Counter name must not exceed 100 characters"),

    code: z
        .string({ error: "Counter code is required" })
        .trim()
        .min(1, "Counter code is required")
        .max(20, "Counter code must not exceed 20 characters")
        .regex(
            /^[A-Za-z0-9_-]+$/,
            "Counter code can contain only letters, numbers, hyphens and underscores"
        ),

    assignedStaffId: z
        .string()
        .min(1, "Assigned staff ID cannot be empty")
        .optional()
        .nullable()
});


const updateCounterSchema = z.object({
    name: z
        .string({ error: "Counter name must be a string" })
        .trim()
        .min(1, "Counter name cannot be empty")
        .max(100, "Counter name must not exceed 100 characters")
        .optional(),

    code: z
        .string({ error: "Counter code must be a string" })
        .trim()
        .min(1, "Counter code cannot be empty")
        .max(20, "Counter code must not exceed 20 characters")
        .regex(
            /^[A-Za-z0-9_-]+$/,
            "Counter code can contain only letters, numbers, hyphens and underscores"
        )
        .optional(),

    assignedStaffId: z
        .string()
        .min(1, "Assigned staff ID cannot be empty")
        .optional()
        .nullable(),

    isActive: z
        .boolean({
            error: "isActive must be a boolean"
        })
        .optional()
});


const counterParamsSchema = z.object({
    counterId: z
        .string()
        .min(1, "Counter ID is required")
});


export {
    createCounterSchema,
    updateCounterSchema,
    counterParamsSchema
};