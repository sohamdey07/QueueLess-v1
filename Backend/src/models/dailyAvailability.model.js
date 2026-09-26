import mongoose from "mongoose";

const dailyAvailabilitySchema = new mongoose.Schema(
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

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        bookedCount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ["OPEN", "CLOSED", "FULL"],
            default: "OPEN"
        }
    },
    {
        timestamps: true
    }
);

dailyAvailabilitySchema.index({ serviceId: 1, date: 1 },{ unique: true });

const DailyAvailability = mongoose.model("DailyAvailability",dailyAvailabilitySchema);

export default DailyAvailability;