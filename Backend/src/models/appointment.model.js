import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: String,
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

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        customerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        customerPhone: {
            type: String,
            required: true,
            trim: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true
        },

        appointmentDate: {
            type: Date,
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ["BOOKED","CHECKED_IN","IN_SERVICE","COMPLETED","CANCELLED","NO_SHOW"],
            default: "BOOKED",
            index: true
        },

        queueEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QueueEntry",
            default: null
        },

        checkedInAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        noShowAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

appointmentSchema.index({
    customerId: 1,
    appointmentDate: -1
});

appointmentSchema.index({
    serviceId: 1,
    appointmentDate: 1
});

const Appointment = mongoose.model("Appointment",appointmentSchema);

export default Appointment;