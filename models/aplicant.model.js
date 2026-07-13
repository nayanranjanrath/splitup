import { Schema, model } from "mongoose"


const aplicantSchema = new Schema({
    request: {
        type: Schema.Types.ObjectId,
        ref: "platformsharerequestmodel"

    },
    applicant:[ {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    }],
    platformname: {
        type: Schema.Types.ObjectId,
        ref: "platformmodel"
    },
   
     createdAt:{
        type:Date,
        default:Date.now
    },
})


const aplicantmodel= new model("aplicantmodel",aplicantSchema)

export default aplicantmodel                    