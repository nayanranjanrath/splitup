import {Schema, model} from "mongoose"

const retingSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"usermodel"
    },
   rater:{
    type:Schema.Types.ObjectId,
    ref:"usermodel"
   },
   rating:{
    type:Number,
    required:true
   }
})


const ratingmodel = new model("ratingmodel",retingSchema)
export default ratingmodel