import mongoose from "mongoose";

const queueEntrySchema = new mongoose.Schema(
    {
        queueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Queue",
            required: true,
            index: true
        },

        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            unique: true,
            index: true
        },

        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },

        token: {
            type: String,
            required: true
        },

        sequenceNumber: {
            type: Number,
            required: true
        },

        position: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "WAITING",
                "CALLED",
                "IN_SERVICE",
                "COMPLETED",
                "SKIPPED",
                "CANCELLED",
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

        calledAt: {
            type: Date,
            default: null
        },

        serviceStartedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        },

        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

queueEntrySchema.index(
    { queueId: 1, token: 1 },
    { unique: true }
);

queueEntrySchema.index(
    { queueId: 1, sequenceNumber: 1 },
    { unique: true }
);

queueEntrySchema.index({
    queueId: 1,
    status: 1,
    position: 1
});

const QueueEntry = mongoose.model("QueueEntry",queueEntrySchema);

export default QueueEntry;