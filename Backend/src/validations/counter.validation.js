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

    serviceId: z
        .string({ error: "Service ID is required" })
        .trim()
        .min(1, "Service ID is required"),

    assignedStaffId: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((val) => (!val || val === "null" || val === "undefined" ? null : val))
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

    serviceId: z
        .string({ error: "Service ID must be a string" })
        .trim()
        .min(1, "Service ID cannot be empty")
        .optional(),

    assignedStaffId: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((val) => {
            if (val === undefined) return undefined;
            if (!val || val === "null" || val === "undefined") return null;
            return val;
        }),

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