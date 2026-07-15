import { Model,Schema } from "mongoose";

const tempchartschema = new Schema({
    
        requestid:{
             type: Schema.Types.ObjectId,
        ref: "platformsharerequestmodel",
        required: true
        },
        status: {
            type: String,
            enum: ["pending", "completed" ],
            default: "pending"
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    
})

const tempchatmodel = new Model("tempchatmodel",tempchartschema)
export default tempchatmodel