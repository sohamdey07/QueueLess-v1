import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        resource: {
            type: String,
            required: true,
            trim: true
        },

        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        method: {
            type: String,
            default: null
        },

        route: {
            type: String,
            default: null
        },

        ipAddress: {
            type: String,
            default: null
        },

        userAgent: {
            type: String,
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

auditSchema.index({
    userId: 1,
    createdAt: -1
});

auditSchema.index({
    resource: 1,
    resourceId: 1
});

const Audit = mongoose.model("Audit", auditSchema);

export default Audit;