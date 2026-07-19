import { Schema, model } from "mongoose";

const finalChatSchema = new Schema({
    groupname: {
        type: String,
       
    },
    
    members: [{
        type: Schema.Types.ObjectId,
        ref: "usermodel"
    }],
 
    existingplans: [{
        type: Schema.Types.ObjectId,
        ref: "planmodel"
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "usermodel"
    }

})

const finalChatModel = model("finalchatmodel", finalChatSchema);

export default finalChatModel