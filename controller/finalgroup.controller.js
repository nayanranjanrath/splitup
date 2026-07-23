import finalChatModel from "../models/finalchat.model";
import { extractuserid } from "./controllers.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import planmodel from "../models/plan.model.js";


export const showallgroups = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        if (!token) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const finalgroups = await finalChatModel.find({ admin: userid._id }).select("-createdAt -__v")
        if (!finalgroups) {
            return res.status(404).json({ success: false, message: "no such finalgroup find " });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "finalgroups found", finalgroups })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const addnewgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const { groupname } = req.body.groupname;
        if (!groupname) {
            return res.status(404).json({ success: false, message: "groupname is required " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const newgroup = new finalChatModel({ admin: userid._id, groupname: groupname });
        await newgroup.save()
        return res.status(200).json({ success: true, message: "group created successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const addmembers = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const { groupid, candidate, requestid } = req.body;

        if (!groupid || !candidate || !requestid) {
            return res.status(404).json({ success: false, message: " all the fiedls are  required " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const group = await finalChatModel.findById(groupid)
        if (!group) {
            return res.status(404).json({ success: false, message: "no such group find " });
        }
        if (group.admin.toString() !== userid._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can add members" });
        }
        const request = await platformsharerequestmodel.findById(requestid)
        if (!request) {
            return res.status(404).json({ success: false, message: "no such request find " });
        }
        const isMember = request.members.some(member =>
            member.equals(userid._id)
        );
        if (!isMember) {
            return res.status(404).json({ success: false, message: "Unauthorized only member can add members" });
        }
        const planexpaire= request.planvalidityday + request.createdAt
        const plan = new planmodel({
            finalchatid: groupid,
            platform: request.platformid,
           planname: request.planname,
           planvalidity: request.planvalidity,
           expiresAt:planexpaire
        })
        await plan.save()
        group.members.push(candidate)
        await group.save()
        return res.status(200).json({ success: true, message: "group members added successfully" })
    }

    catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}
// now i have to create some controller about the add plans ,add the signin details of the platform etc ,delete group request so that before deleteing every memner get the message so that they can approve the delete 

