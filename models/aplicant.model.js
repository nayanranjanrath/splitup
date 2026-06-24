import { Schema, model } from "mongoose"

const aplicantSchema = new Schema({
    requister: {
        type: Schema.Types.ObjectId,
        ref: "platformsharerequestmodel"

    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
})


const aplicantmodel= new model("aplicant",aplicantSchema)

export default aplicantmodel                    