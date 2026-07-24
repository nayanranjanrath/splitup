import tempChatModel from "../models/tempchat.model.js";
import { extractuserid } from "./controllers.js"
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import paymentproofmodel from "../models/paymentproof.model.js";
import { uploadtocloudinar } from "../utility/cloudinary.js"
import finalChatModel from "../models/finalchat.model.js";
import planmodel from "../models/plan.model.js";
export const showallgroup = async (req, res) => {
    try {
        const userid = req.cookies.accesstoken
        const user = extractuserid(userid)
        if (!user) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const requests = await platformsharerequestmodel
            .find({
                $or: [
                    { requister: user._id },
                    { members: { $in: [user._id] } }
                ]
            })
            .select("_id ")

        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: "you don't have requests " });
        }
        const requestIds = requests.map(request => request._id);

        const groups = await tempChatModel.find({
            request: { $in: requestIds }
        }).populate({
            path: "request",
            select: "platformname requister members status expiresAt",
            populate: [
                {
                    path: "platformname",
                    select: "platformname"
                },
                {
                    path: "requister",
                    select: "profilename"
                },
                {
                    path: "members",
                    select: "profilename avatar"
                }
            ]
        });

        if (!groups) {
            return res.status(404).json({ success: false, message: "you don't have groups " });
        }

        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "groups found", groups });
    } catch (error) {
        console.log(error

        )
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}
export const sendpaymentproof = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const requestid = req.body.requestid
        let proofimage = req.file?.path;
        if (!prooofimage) {
            return res.status(404).json({ success: false, message: "payment proof is required" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        if (!requestid) {
            return res.status(404).json({ success: false, message: "request not found" });
        }
        const request = await platformsharerequestmodel.findById(requestid)
        if (!request) {
            return res.status(404).json({ success: false, message: "request not found" });
        }
        const paymentproof = await paymentproofmodel.findOne({ $and: [{ request: requestid }, { user: userid }] },)
        if (paymentproof.status === "approved"||paymentproof.status === "pending") {
            return res.status(404).json({ success: false, message: "payment proof already sent" });
        }
        
        const proof = await uploadtocloudinar(proofimage)


        const newproof = new paymentproofmodel({
            request: requestid,
            user: userid,
            proofimage: {
                url: proof.url,
                publicId: proof.public_id
            }
        });
        await newproof.save()
        return res.status(200).json({ success: true, message: "payment proof sent successfully" })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const aproveusers =async(req,res)=>{
   try {
          const token = req.cookies.accesstoken
        const paymentproofid=req.body.paymentproofid;
        if(!paymentproofid){
            return res.status(404).json({ success: false, message: "payment proof id is required " }); 
        }
      
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const payment = await paymentproofmodel.findById(paymentproofid).populate("request", "requister")
        if(!payment){
            return res.status(404).json({ success: false, message: "no such paymentproof find " });
        }
        if(payment.request.requister.toString() !== userid._id.toString()){
            return res.status(403).json({ success: false, message: "Unauthorized only requester can aprove users" });
        }
        
        payment.status="approved"
        await payment.save()
        return res.status(200).json({ success: true, message: "payment proof approved successfully" })

   } catch (error) {
     console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
   }
}

export const rejectusers =async(req,res)=>{
    try {
        const token = req.cookies.accesstoken
        const paymentproofid=req.body.paymentproofid;
        if(!paymentproofid){
            return res.status(404).json({ success: false, message: "payment proof id is required " }); 
        }
      
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const payment = await paymentproofmodel.findById(paymentproofid).populate("request", "requister")
        if(!payment){
            return res.status(404).json({ success: false, message: "no such paymentproof find " });
        }
        if(payment.request.requister.toString() !== userid._id.toString()){
            return res.status(403).json({ success: false, message: "Unauthorized only requester can aprove users" });
        }
        if(payment.status=="approved"){
             return res.status(404).json({ success: true, message: "you cant reject approved payment proof" })
        }
        payment.status="rejected"
        await payment.save()
        return res.status(200).json({ success: true, message: "payment proof rejected successfully" })

    } catch (error) {
         console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showallproofimage =async(req,res)=>{
    try {
        const token = req.cookies.accesstoken
        const requestid = req.body.requestid
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const payment = await paymentproofmodel.find({ request: requestid }).select("-createdAt -__v")
        if(!payment){
            return res.status(404).json({ success: false, message: "no such paymentproof find " });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "payment proof found", payment })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" }) 
    }
}

