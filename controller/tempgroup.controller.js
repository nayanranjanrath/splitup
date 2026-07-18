import tempChatModel from "../models/tempchat.model.js";
import { extractuserid } from "./controllers.js"
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
export const showallgroup = async (req, res) => {
    try {
        const userid = req.cookies.accesstoken
        const user = extractuserid(userid)
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
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