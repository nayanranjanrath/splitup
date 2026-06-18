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
    return jwt.sign({_id:this._id},process.env.ACCESSTOKEN_SECRET,{expiresIn:ACCESSTOKEN_EXP})
}
userSchema.methods.createrefreshtoken=function(){
    return jwt.sign({_id:this._id},process.env.REFRESHTOKEN_SECRET,{expiresIn:REFRESHTOKEN_EXP})
}
const usermodel = new model("user",userSchema)

export default usermodel