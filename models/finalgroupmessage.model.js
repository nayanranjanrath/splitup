import { Schema, model } from "mongoose";


const finalmessageSchema = new Schema({

    room: {
        type: Schema.Types.ObjectId,
        ref: "finalchatmodel",
        required: true
    },

    sender: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },

    encryptedmessage: {
        type: String,
        required: true,
        
    },

    iv: {
        type: String,
        required: true
    },

    authTag: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
     expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        index: {
            expires: 0
        }
    }


});

const finalmessageModel = model("finalmessagemodel", finalmessageSchema);

export default finalmessageModel