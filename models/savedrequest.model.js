import mongoose from "mongoose";

const savedRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "usermodel",
            required: true,
            index: true
        },

        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "platformsharerequest",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Same user cannot save the same request twice
savedRequestSchema.index(
    { user: 1, request: 1 },
    { unique: true }
);

const savedrequestmodel=  mongoose.model("savedrequest", savedRequestSchema);
export default savedrequestmodel