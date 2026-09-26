import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    appointments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
        }
    ],
    role: {
        type: String,
        enum: ["CUSTOMER","STAFF", "ADMIN"],
        default: "CUSTOMER",
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;