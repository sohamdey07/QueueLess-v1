import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
    {
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true
        },

        date: {
            type: String,
            required: true,
            index: true
        },

        currentToken: {
            type: Number,
            default: 0,
            min: 0
        },

        nextToken: {
            type: Number,
            default: 1,
            min: 1
        },

        status: {
            type: String,
            enum: ["ACTIVE", "CLOSED"],
            default: "ACTIVE"
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