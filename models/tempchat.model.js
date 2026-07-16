import { Schema, model } from "mongoose";

const tempChatSchema = new Schema({

    request: {
        type: Schema.Types.ObjectId,
        ref: "platformsharerequestmodel",
        required: true,
        unique: true
    },

    paidUsers: [{
        type: Schema.Types.ObjectId,
        ref: "usermodel"
    }],

  

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const tempChatModel = model("tempchatmodel", tempChatSchema);

export default tempChatModel;