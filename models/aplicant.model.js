import { Schema, model } from "mongoose"


const aplicantSchema = new Schema({
    request: {
        type: Schema.Types.ObjectId,
        ref: "platformsharerequest"

    },
    applicant:[ {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    }],
    platformname: {
        type: Schema.Types.ObjectId,
        ref: "platform"
    },
   
     createdAt:{
        type:Date,
        default:Date.now
    },
})


const aplicantmodel=  model("aplicantmodel",aplicantSchema)

export default aplicantmodel                    