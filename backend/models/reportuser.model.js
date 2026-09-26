import { Schema,model } from "mongoose";

const reportuserSchema = new Schema({
    reporteduser: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
    reporter: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved"],
        default: "pending"
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})


const reportusermodel = new model("reportusermodel", reportuserSchema)
export default reportusermodel