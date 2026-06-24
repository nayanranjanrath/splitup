
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
}]


})


const platformsharerequestmodel = new model("platformsharerequest",platformsharerequest)
export default platformsharerequestmodel