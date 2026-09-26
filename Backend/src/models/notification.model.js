import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },

        type: {
            type: String,
            enum: [
                "APPOINTMENT_BOOKED",
                "APPOINTMENT_CANCELLED",
                "APPOINTMENT_REMINDER",
                "QUEUE_JOINED",
                "QUEUE_CALLED",
                "QUEUE_RECALLED",
                "QUEUE_COMPLETED",
                "GENERAL"
            ],
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        channel: {
            type: String,
            enum: ["IN_APP", "EMAIL"],
            required: true
        },

        isRead: {
            type: Boolean,
            default: false
        },

        sentAt: {
            type: Date,
            default: null
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    userId: 1,
    isRead: 1,
    createdAt: -1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;