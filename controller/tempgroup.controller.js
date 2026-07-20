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
      const session = await mongoose.startSession();
    try {
           
        const token = req.cookies.accesstoken
        const userid = extractuserid(token)
        const candidateid = req.body.candidateid
        const finalgroupname = req.body.finalgroupname
        if(!finalgroupname){
            return res.status(404).json({ success: false, message: "finalgroupname is required" });
        }
        if(!candidateid){
            return res.status(404).json({ success: false, message: "candidateid is required" });
        }
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const requestid = req.body.requestid
        if (!requestid) {
            return res.status(404).json({ success: false, message: "request not found" });
        }
        session.startTransaction();
        const request = await platformsharerequestmodel.findById(requestid)  .session(session);

        if (!request) {
            return res.status(404).json({ success: false, message: "request not found" });
        }
        if(request.requister.toString() !== userid._id.toString()){
            return res.status(403).json({ success: false, message: "Unauthorized only requester can aprove users" });
        }
        const paymentproof = await paymentproofmodel.findOne({ $and: [{ request: requestid }, { user:candidateid }] },)  .session(session);

        if (!paymentproof) {
            return res.status(404).json({ success: false, message: "payment proof not found" });
        }
        paymentproof.status = "approved"
        
       await paymentproof.save({ session });

        const finalchat = await finalChatModel.findOne({ $and: [{ admin: userid._id }, { groupname:finalgroupname}] },)  .session(session);

        if (!finalchat) {
           const newfinalchat = new finalChatModel(
            {   admin:userid._id,
                groupname:finalgroupname,
                members:[userid._id,candidateid]


            }
           )

            const plan = new planmodel({
                finalchatid: newfinalchat._id,
                platform: request.platform,
                planname: request.planname,
                planvalidity: request.planvalidity,
                
            })
           
             await newfinalchat.save({ session });
                await plan.save({ session });

        await session.commitTransaction();
           
            return res.status(200).json({ success: true, message: "finalchat created successfully" })
        }
        const alreadyMember = finalchat.members.some(member =>
    member.equals(candidateid)
);
        if(alreadyMember){
            return res.status(400).json({ success: false, message: "user already added" })
        }
        finalchat.members.push(candidateid)
       await finalchat.save({ session });

await session.commitTransaction();

        return res.status(200).json({ success: true, message: "proof approved successfully" })

    } catch (error) {
          

        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
        await session.abortTransaction();
    }
        finally {

        session.endSession();
        }
    
}

export const rejectusers =async(req,res)=>{
    try {
        
    } catch (error) {
        
    }
}

export const showallproofimage =async(req,res)=>{
    try {
        
    } catch (error) {
        
    }
}