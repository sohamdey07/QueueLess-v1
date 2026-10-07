import { z } from "zod";

const queueParamsSchema = z.object({
    queueId: z
        .string({ error: "Queue ID is required" })
        .min(1, "Queue ID is required")
});

const queueEntryParamsSchema = z.object({
    queueEntryId: z
        .string({ error: "Queue entry ID is required" })
        .min(1, "Queue entry ID is required")
});

export {
    queueParamsSchema,
    queueEntryParamsSchema
};