import {Schema, model} from "mongoose"

const paymentproofSchema = new Schema({
    request: {
        type: Schema.Types.ObjectId,
        ref: "platformsharerequestmodel",
        required: true,
        
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
    proofimage: [
        {
            url: {
                type: String,
                required: true
            },
            publicId: {
                type: String,
                required: true
            }
        }
    ],
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const paymentproofmodel = new model("paymentproofmodel",paymentproofSchema)
export default paymentproofmodel