import {schema, model} from "mongoose"
import { transpileModule } from "typescript"

const userSchema = new schema({
    profilename:{
        type:String,
        required:true,
        unique:true,
        maxlength:10,
        lawercase:true,
        trim:true,
        index:true
    },
    fullname:{
        type:String,
        maxlength:10
        
    },
    avatar:{
        type:String
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lawercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true

    },
    refreshtoken:{
        type:String
    },
   
    phoneno:{
        type:number,
        required:true,
        unique:true,
        maxlength:10
    },
     createdAt:{
        type:Date,
        default:Date.now
    },
   
})



const usermodel = new model("user",userSchema)

export default usermodel