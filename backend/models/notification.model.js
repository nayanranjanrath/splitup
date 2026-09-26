import {Schema, model} from "mongoose";

const notificationSchema = new Schema({

    user: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    seen: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        index: {
            expires: 0
        }
    }
})

const notificationmodel = new model("notificationmodel",notificationSchema)
export default notificationmodel