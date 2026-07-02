import { Schema,model } from "mongoose";

const categorySchema = new Schema({
    categoryname: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    platform:[{
        type:Schema.Types.ObjectId,
        ref:"platformmodel"
    }]

   
})


const categorymodel = new model("category", categorySchema)

export default categorymodel    