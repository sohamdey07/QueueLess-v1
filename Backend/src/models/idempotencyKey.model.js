import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        endpoint: {
            type: String,
            required: true
        },

        requestHash: {
            type: String,
            required: true
        },

        statusCode: {
            type: Number,
            default: null
        },

        response: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Automatically remove expired idempotency records
idempotencyKeySchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const IdempotencyKey = mongoose.model(
    "IdempotencyKey",
    idempotencyKeySchema
);

export default IdempotencyKey;