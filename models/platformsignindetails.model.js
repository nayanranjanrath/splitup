import {Schema, model} from "mongoose";

const platformsignindetailschema = new Schema({
    planname: {
        type: Schema.Types.ObjectId,
        ref: "planmodel",
        required: true
    },
    platformemail: {
        type: String,
        required: true
    },
    mailiv: {
        type: String,
        required: true
    },
    mailauth: {
        type: String,
        required: true
    },
    platformpassword: {
        type: String,
        required: true
    },
    passwordiv: {
        type: String,
        required: true
    },
    passwordauth: {
        type: String,
        required: true
    }
})

const platformsignindetailsmodel = new model("platformsignindetails", platformsignindetailschema)
export default platformsignindetailsmodel