import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        
        description: {
            type: String,
            default: "",
            maxlength: 1000
        },
        
        email: {
            type: String,
            lowercase: true,
            trim: true,
            unique: true,
        },

        phone: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
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


const Organization = mongoose.model("Organization",organizationSchema);

export default Organization;