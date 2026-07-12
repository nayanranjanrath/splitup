import { Schema,model } from "mongoose";

const reportbugSchema = new Schema({
  
    reporter: {
        type: Schema.Types.ObjectId,
        ref: "usermodel",
        required: true
    },
    report: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now}
    })

    const reportbugmodel = new model("reportbugmodel",reportbugSchema)
    export default reportbugmodel