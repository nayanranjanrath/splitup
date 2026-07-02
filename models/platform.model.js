import { Schema,model } from "mongoose";

const platformschema = new Schema({

    platformname: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true 
    },
   
    platformdescription: {
        type: String,
        
                
    },    
   

 createdAt:{
        type:Date,
        default:Date.now
    },

    })


    const platformmodel = new model("platform", platformschema)
    export default platformmodel