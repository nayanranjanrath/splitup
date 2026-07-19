import { Schema, model } from "mongoose";

const finalChatSchema = new Schema({
   finalchatid: {
         type: Schema.Types.ObjectId,
        ref: "finalchatmodel",
        required: true,
        
   },
   platform: {
        type: Schema.Types.ObjectId,
        ref: "platformmodel",
        required: true
    },
    planname: {
        type: String,
        required: true
    },
    planvalidity: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    platformemail: {
        type: String,
        required: true
    },
    platformepassword: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        
    }

})

const finalChatModel = model("finalchatmodel", finalChatSchema);

export default finalChatModel