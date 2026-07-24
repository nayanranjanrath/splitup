import {Schema, model} from "mongoose";

const deletefinalgrouprequestmodel = new Schema({
   groupid: {
       type: Schema.Types.ObjectId,
       ref: "finalchatmodel",
       required: true
   },
   agreedmembers: [{
       type: Schema.Types.ObjectId,
       ref: "usermodel"
   }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const deletefinalgrouprequest = model("deletefinalgrouprequestmodel", deletefinalgrouprequestmodel)
export default deletefinalgrouprequest