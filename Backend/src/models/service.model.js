import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            unique: true
        },

        description: {
            type: String,
            default: ""
        },

        imageUrl: {
            type: String,
            default: "https://pixabay.com/images/download/geralt-mark-804938_1920.jpg"
        },

        service_time:{
            type: String,
            required: true
        },

        duration: {
            type: Number,
            required: true,
            min: 1
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

serviceSchema.index({ name: 1, code: 1 }, { unique: true });

const Service = mongoose.model("Service", serviceSchema);

export default Service;