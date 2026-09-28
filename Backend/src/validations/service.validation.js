import { z } from "zod";

const serviceIdSchema = z
	.string()
	.regex(/^[a-f\d]{24}$/i, "Invalid service ID");

const serviceFields = {
	name: z
		.string()
		.trim()
		.min(2, "Service name must be at least 2 characters")
		.max(100, "Service name cannot exceed 100 characters"),

	code: z
		.string()
		.trim()
		.min(1, "Service code is required")
		.max(20, "Service code cannot exceed 20 characters")
		.transform((value) => value.toUpperCase()),

	description: z
		.string()
		.trim()
		.max(200, "Description cannot exceed 200 characters")
		.optional(),

	imageUrl: z
		.string()
		.url("Invalid image URL")
		.optional(),

	service_time: z
		.string()
		.trim()
		.min(1, "Service time is required"),

	duration: z
		.coerce
		.number()
		.int("Duration must be a whole number")
		.min(1, "Duration must be at least 1"),

	capacity: z
		.coerce
		.number()
		.int("Capacity must be a whole number")
		.min(1, "Capacity must be at least 1"),

	isActive: z.boolean().optional()
};

const createServiceSchema = z.object({
	body: z.object(serviceFields),
	params: z.object({}),
	query: z.object({})
});

const updateServiceSchema = z.object({
	body: z
		.object(serviceFields)
		.partial()
		.refine((body) => Object.keys(body).length > 0, {
			message: "At least one field is required to update the service"
		}),
	params: z.object({
		serviceId: serviceIdSchema
	}),
	query: z.object({})
});

export {
	createServiceSchema,
	updateServiceSchema
};
