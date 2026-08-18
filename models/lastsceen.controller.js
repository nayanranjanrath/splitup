import {Schema, model} from "mongoose";

const lastsceenSchema = new Schema({

    user: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
   
   finalgroup:{
       type: Schema.Types.ObjectId,
       ref: "finalchatmodel"
   },
   tempgroup:{
       type: Schema.Types.ObjectId,
       ref: "tempchatmodel"
   },
   
    createdAt: {
        type: Date,
        default: Date.now
    },

    
 
})

const lastsceenmodel = new model("lastsceenmodel",lastsceenSchema)
export default lastsceenmodel