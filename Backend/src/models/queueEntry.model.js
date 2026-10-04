import mongoose from "mongoose";

const queueEntrySchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            unique: true,
            index: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true
        },

        queueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Queue",
            required: true,
            index: true
        },

        tokenNumber: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: [
                "WAITING",
                "CALLED",
                "SERVING",
                "COMPLETED",
                "SKIPPED",
                "NO_SHOW"
            ],
            default: "WAITING",
            index: true
        },

        counterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Counter",
            default: null
        },

        joinedAt: {
            type: Date,
            default: Date.now
        },

        calledAt: {
            type: Date,
            default: null
        },

        servingAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

queueEntrySchema.index(
    { queueId: 1, tokenNumber: 1 },
    { unique: true }
);

const QueueEntry = mongoose.model(
    "QueueEntry",
    queueEntrySchema
);

export default QueueEntry;