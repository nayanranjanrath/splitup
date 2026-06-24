import {Schema, model} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    profilename:{
        type:String,
        required:true,
        unique:true,
        maxlength:10,
        lowercase:true,
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
          lowercase:true,
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
        type:Number,
        required:true,
        unique:true,
        maxlength:10
    },
     createdAt:{
        type:Date,
        default:Date.now
    },
   
})


userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10)
    }
    return 
})

userSchema.methods.ispasswordcorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.createaccesstoken=function(){
    return jwt.sign({_id:this._id},process.env.ACCESSTOKEN_SECRET,{expiresIn:process.env.ACCESSTOKEN_EXP})
}
userSchema.methods.createrefreshtoken=function(){
    return jwt.sign({_id:this._id},process.env.REFRESHTOKEN_SECRET,{expiresIn:process.env.REFRESHTOKEN_EXP})
}
const usermodel = new model("user",userSchema)

export default usermodel