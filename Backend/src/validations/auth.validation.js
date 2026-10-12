import { z } from "zod";

const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name cannot exceed 100 characters"),

        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),

        phone: z
            .string()
            .trim()
            .optional(),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(100, "Password cannot exceed 100 characters")
    }),

    params: z.object({}),

    query: z.object({})
});

const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(100, "Password cannot exceed 100 characters")
    }),
});

const verifyAccountSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),
        
        otp: z
            .string()
            .length(6, "OTP must be 6 characters")
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase())
    })
});

const verifyResetOtpSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email("Invalid email address")
            .transform((value) => value.toLowerCase()),

        otp: z
            .string()
            .length(6, "OTP must be 6 characters")
    })
});

const resetPasswordSchema = z.object({
    body: z.object({
        resetToken: z
            .string()
            .min(10, "Invalid reset token"),

        newPassword: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(100, "Password cannot exceed 100 characters")
    })
});

const verifyResetLinkSchema = z.object({
    body: z.object({
        token: z
            .string()
            .min(10, "Invalid reset link token")
            .optional(),
        resetToken: z
            .string()
            .min(10, "Invalid reset link token")
            .optional()
    }).refine((data) => data.token || data.resetToken, {
        message: "Reset token is required",
        path: ["token"]
    })
});

export {
    registerSchema,
    loginSchema,
    verifyAccountSchema,
    forgotPasswordSchema,
    verifyResetOtpSchema,
    verifyResetLinkSchema,
    resetPasswordSchema
};