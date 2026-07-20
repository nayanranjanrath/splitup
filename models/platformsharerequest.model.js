
import {Schema, model} from "mongoose"

const platformsharerequest= new Schema({

platformname:{
    type:Schema.Types.ObjectId,
    ref:"platformmodel"
    
},
requister:{
type: Schema.Types.ObjectId,
ref: "usermodel"

},
proofimage: [
    {
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        }
    }
],

planvalidityday:{
    type:Number,
    required:true,    
    
},
planprice:{

type:Number,
required:true,    
},
planname:{
    type:String,
     required:true, 
},

status: {
    type: String,
    enum: ["open", "full", "closed"],
    default: "open"
},
totalslots: {
    type: Number,
    required: true
},
members: [{
    type: Schema.Types.ObjectId,
    ref: "usermodel"
}],
 createdAt:{
        type:Date,
        default:Date.now
    },
     expiresAt: {
        type: Date,
        required: true
    },

})


const platformsharerequestmodel = new model("platformsharerequest",platformsharerequest)
export default platformsharerequestmodel