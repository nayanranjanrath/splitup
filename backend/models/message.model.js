import { Schema, model } from "mongoose";


const messageSchema = new Schema({

    room: {
        type: Schema.Types.ObjectId,
        ref: "tempchatmodel",
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

const messageModel = model("messagemodel", messageSchema);

export default messageModel