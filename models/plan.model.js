import { Schema, model } from "mongoose";

const planschema = new Schema({
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
    platformsignindetails: {
      type: Schema.Types.ObjectId,
        ref: "platformsignindetailsmodel",
        
       
    },
   
    expiresAt: {
        type: Date,
        
    }

})

const planmodel = model("planmodel", planschema );

export default planmodel