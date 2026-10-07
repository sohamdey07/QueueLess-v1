import mongoose from "mongoose";

const queueEntrySchema = new mongoose.Schema(
    {
        appointmentId: {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: true
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
            required: true
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

// One appointment can enter the queue only once.
queueEntrySchema.index(
    { appointmentId: 1 },
    { unique: true }
);

// Token numbers must be unique within a queue.
queueEntrySchema.index(
    { queueId: 1, tokenNumber: 1 },
    { unique: true }
);

// A counter can have only one active customer.
queueEntrySchema.index(
    { counterId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["CALLED", "SERVING"] }
        }
    }
);

const QueueEntry = mongoose.model("QueueEntry", queueEntrySchema);

export default QueueEntry;