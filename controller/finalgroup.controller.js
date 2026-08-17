import finalChatModel from "../models/finalchat.model";
import { extractuserid } from "./controllers.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import planmodel from "../models/plan.model.js";
import platformmodel from "../models/platform.model.js";
import redis from "../utility/redisconnection.js"
import platformsignindetailsmodel from "../models/platformsignindetails.model.js"
import deletefinalgrouprequest from "../models/deletefinalgrouprequestt.model.js"
import { encryptMessage, decryptMessage } from "../utility/messageencryption.js";
import notificationmodel from "../models/notification.model.js"
import mongoose from "mongoose";
export const showalladmingroups = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        if (!token) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const finalgroups = await finalChatModel.find({ admin: userid._id }).select("-createdAt -__v -admin")
        if (!finalgroups) {
            return res.status(404).json({ success: false, message: "no such finalgroup find " });
        }

        return res.status(200).json({ success: true, message: "finalgroups found", finalgroups })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const addnewgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const groupname = req.body.groupname;
        if (!groupname) {
            return res.status(404).json({ success: false, message: "groupname is required " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const newgroup = new finalChatModel({ admin: userid._id, groupname: groupname });
        newgroup.members.push(userid._id)
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
            member.equals(candidate)
        );
        if (!isMember) {
            return res.status(404).json({ success: false, message: "Unauthorized only member can add members" });
        }
        const alreadyMember = group.members.some(member =>
            member.equals(candidate)
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a member of this group"
            });
        }
        const existingplan = await planmodel.findOne({ finalchatid: groupid, platform: request.platformname })
        if (!existingplan) {
            const planexpaire = new Date(
                request.createdAt.getTime() +
                request.planvalidityday * 24 * 60 * 60 * 1000
            );
            const plan = new planmodel({
                finalchatid: groupid,
                platform: request.platformname,
                planname: request.planname,
                planvalidity: request.planvalidityday,
                expiresAt: planexpaire
            });
            await plan.save()
        }

        group.members.push(candidate)
        await group.save()

        const notifcation = await notificationmodel.create(
            {
                user: candidate,

                message: `You have been successfully added to a new group: ${group.groupname}`,
            }
        )
        notifcation.save()
        return res.status(200).json({ success: true, message: "group members added successfully" })
    }

    catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}


export const selectplatformtofinalgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const platformid = req.body.platformid;

        if (!platformid) {
            return res.status(404).json({ success: false, message: " platform id is required  " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        redis.set(`platform${userid._id}`, platformid, 'EX', 300)
        return res.status(200).json({ success: true, message: "platform added successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}
export const addplan = async (req, res) => {
    try {
        const token = req.cookies.accesstoken


        const { groupid, planname, planvalidity } = req.body;

        if (!groupid || !planname || !planvalidity) {
            return res.status(404).json({ success: false, message: " all the fiedls are  required try again  " });
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
            return res.status(403).json({ success: false, message: "Unauthorized only admin can add plan" });
        }
        const platform = await redis.get(`platform${userid._id}`)
        if (!platform) {
            return res.status(404).json({ success: false, message: "no platfom selected or selected platform expaired please try again  " });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + planvalidity * 24 * 60 * 60 * 1000);
        const plan = new planmodel({
            finalchatid: groupid,
            platform: platform,
            planname: planname,
            planvalidity: planvalidity,
            expiresAt: expiresAt
        })
        await plan.save()
           await Promise.all(
            group.members.map(member =>
                notificationmodel.create({
                    user: member,
                    message: `A new plan has been added to the group: ${group.groupname}`,
                })
            )
        );
        return res.status(200).json({ success: true, message: "plan added successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const addsignindetails = async (req, res) => {
    try {

        const token = req.cookies.accesstoken
        const { planid, platformemail, platformepassword } = req.body;

        if (!planid || !platformemail || !platformepassword) {
            return res.status(404).json({ success: false, message: " all the fiedls are  required " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const plan = await planmodel.findById(planid).populate('finalchatid')
        if (!plan) {
            return res.status(404).json({ success: false, message: "no such plan find " });
        }
        const planmail = encryptMessage(platformemail.trim())
        const planpassword = encryptMessage(platformepassword.trim())
        if (plan.finalchatid.admin.toString() !== userid._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can add signup details " });
        }
        const singupdetails = new platformsignindetailsmodel({
            planname: planid,
            platformemail: planmail.encryptedMessage,
            mailiv: planmail.iv,
            mailauth: planmail.authTag,
            platformpassword: planpassword.encryptedMessage,
            passwordiv: planpassword.iv,
            passwordauth: planpassword.authTag
        })
        await singupdetails.save()
        return res.status(200).json({ success: true, message: "signin details added successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const deletegrouprequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const { groupid } = req.body;

        if (!groupid) {
            return res.status(404).json({ success: false, message: " all the fiedls are  required " });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const group = await finalChatModel.findById(groupid).select('admin _id members')
        if (!group) {
            return res.status(404).json({ success: false, message: "no such group find " });
        }
        if (group.admin.toString() !== userid._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can delete group" });
        }
        const deleterequest = await deletefinalgrouprequest.findOne({ groupid: groupid })
        if (deleterequest) {
            return res.status(404).json({ success: false, message: "you alredy send a request now wait for others to aprove this " });
        }
        const newrequest = new deletefinalgrouprequest({
            groupid: groupid,
            agreedmembers: [userid._id]
        });
        await newrequest.save()

        await Promise.all(
            group.members.map(member =>
                notificationmodel.create({
                    user: member,
                    message: `there is a delete request for group: ${group.groupname}`,
                })
            )
        );

        return res.status(200).json({ success: true, message: "group deleted request sent successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const acceptdeleterequest = async (req, res) => {
    const session = await mongoose.startSession();

    try {

        await session.withTransaction(async () => {

            const token = req.cookies.accesstoken;
            const { groupid } = req.body;

            if (!groupid) {
                return res.status(404).json({
                    success: false,
                    message: "all the fields are required"
                });
            }

            const userid = extractuserid(token);

            if (!userid) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const group = await finalChatModel
                .findById(groupid)
                .select("members admin _id")
                .session(session);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: "no such group found"
                });
            }

            if (group.admin.toString() === userid._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "you created the request now wait for others to approve this"
                });
            }

            const validmember = group.members.some(member =>
                member.equals(userid._id)
            );

            if (!validmember) {
                return res.status(404).json({
                    success: false,
                    message: "you are not a member of this group"
                });
            }

            const deleterequest = await deletefinalgrouprequest
                .findOne({ groupid: groupid })
                .session(session);

            if (!deleterequest) {
                return res.status(404).json({
                    success: false,
                    message: "no such request found"
                });
            }

            if (
                deleterequest.agreedmembers.some(member =>
                    member.equals(userid._id)
                )
            ) {
                return res.status(404).json({
                    success: false,
                    message: "you already approved the request"
                });
            }

            deleterequest.agreedmembers.push(userid._id);

            if (deleterequest.agreedmembers.length >= group.members.length) {

                const plans = await planmodel
                    .find({ finalchatid: groupid })
                    .session(session);

                await platformsignindetailsmodel.deleteMany(
                    {
                        planname: {
                            $in: plans.map(plan => plan._id)
                        }
                    },
                    { session }
                );

                await planmodel.deleteMany(
                    {
                        finalchatid: groupid
                    },
                    { session }
                );

                await deleterequest.deleteOne({ session });
                await Promise.all(
                    group.members.map(member =>
                        notificationmodel.create({
                            user: member,
                            message: `delete request of group: ${group.groupname} is approved by everyone so we are removbing the group and its related data `,
                        })
                    )
                );
                await group.deleteOne({ session });

                return res.status(200).json({
                    success: true,
                    message: "group deleted successfully"
                });
            }

            await deleterequest.save({ session });

            return res.status(200).json({
                success: true,
                message: "group delete request accepted successfully"
            });

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internal server error"
        });

    } finally {

        await session.endSession();

    }

}

export const rejectdeleterequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const { groupid } = req.body


        if (!groupid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }

        if (!mongoose.isValidObjectId(groupid)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group ID"
            });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" })
        }
        const group = await finalChatModel
            .findById(groupid)
            .select("members admin _id")


        if (!group) {
            return res.status(404).json({
                success: false,
                message: "no such group found"
            });
        }

        if (group.admin.toString() === userid._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "you created the request now wait for others to approve this"
            });
        }

        const validmember = group.members.some(member =>
            member.equals(userid._id)
        );

        if (!validmember) {
            return res.status(404).json({
                success: false,
                message: "you are not a member of this group"
            });
        }

        const deleterequest = await deletefinalgrouprequest.findOne({ groupid: groupid })
        if (!deleterequest) {
            return res.status(404).json({ success: false, message: "no such request found" })
        }
        if (deleterequest.agreedmembers.some(member => member.equals(userid._id))) {
            return res.status(404).json({ success: false, message: "you already approved the request" })
        }
        await deleterequest.deleteOne()
           await Promise.all(
            group.members.map(member =>
                notificationmodel.create({
                    user: member,
                    message: `delete request of group: ${group.groupname} is rejected by some user so we cant delete the group `,
                })
            )
        );
        return res.status(200).json({ success: true, message: "group delete request rejected successfully" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showdeleterequest = async (req, res) => {
    try {
        const { groupid } = req.params;
        if (!groupid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }
        const deleterequest = await deletefinalgrouprequest.findOne({ groupid: groupid })
        if (!deleterequest) {
            return res.status(404).json({ success: false, message: "no such request found" })
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, deleterequest })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}


export const showlogindetails = async (req, res) => {
    try {
        const tokeb = req.cookies.accesstoken
        const planid = req.params.planid
        if (!planid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }
        if (!tokeb) {
            return res.status(403).json({ success: false, message: "Unauthorized" })
        }
        const userid = extractuserid(tokeb)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" })
        }
        const logindetails = await platformsignindetailsmodel
            .findOne({ planname: planid })
            .populate({
                path: "planname",
                select: "platform planname finalchatid",
                populate: {
                    path: "finalchatid",
                    select: "groupname members "
                }
            });
        console.log("logindetails", logindetails)
        if (!logindetails) {
            return res.status(404).json({ success: false, message: "no logindetails found" })
        }
        if (logindetails.planname.finalchatid.members.some(member => member.equals(userid._id))) {
            return res.status(401).json({ success: false, message: "Unauthorized only the group meembers are allow to check the login details " })
        }
        const loginid = await decryptMessage(logindetails.platformemail, logindetails.mailiv, logindetails.mailauth)
        const loginpassword = await decryptMessage(logindetails.platformpassword, logindetails.passwordiv, logindetails.passwordauth)



        return res.status(200).json({ success: true, loginid, loginpassword })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}