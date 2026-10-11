import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        assignedStaffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        
        serviceId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Service",
            required:true
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

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;