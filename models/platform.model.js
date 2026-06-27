import { Schema,model } from "mongoose";

const platformschema = new Schema({

    platformname: {
        type: String,
        required: true,
        unique: true
    },
    platformurl: {
        type: String,
        required: true,
        unique: true
    },
    platformdescription: {
        type: String,
        
                
    },    
    category: {
    type: Schema.Types.ObjectId,
    ref: "categorymodel",
required: true

},
 createdAt:{
        type:Date,
        default:Date.now
    },

    })


    const platformmodel = new model("platform", platformschema)
    export default platformmodel