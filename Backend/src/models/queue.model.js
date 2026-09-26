import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
    {
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        date: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["OPEN", "CLOSED"],
            default: "OPEN"
        },

        lastTokenNumber: {
            type: Number,
            default: 0
        },

        currentToken: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

queueSchema.index(
    { serviceId: 1, date: 1 },
    { unique: true }
);

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;