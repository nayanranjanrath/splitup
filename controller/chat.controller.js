import lastsceenmodel from "../models/lastsceen.controller";
import finalmessageModel from "../models/finalgroupmessage.model";
import finalChatModel from "../models/finalchat.model";
import tempChatModel from "../models/tempchat.model";
import messageModel from "../models/message.model";
import { extractuserid } from "./controllers.js"
import e from "express";


export const getunsceenfinalgroupmessaeg = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const groupid = req.params.groupid
        if (!groupid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }
        if (!token) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const group = await finalChatModel.findById(groupid).select('members admin _id groupname')
        if (!group) {
            return res.status(404).json({ success: false, message: "no such group find " });
        }

        if (group.members.some(member => member.equals(userid._id))) {
            const lastsceen = await lastsceenmodel.findOne({ user: userid._id, finalgroup: groupid })
            if (!lastsceen) {
                const lastsceentime = Date.now()
            }
            else {
                const lastsceentime = lastsceen.createdAt
            }
            const query = {
                groupid,
                createdAt: { $gt: lastSeenAt }
            };

            if (cursor) {
                query._id = { $gt: cursor };
            }

            const unsceenmessage = await finalmessageModel
                .find(query)
                .sort({ _id: 1 })
                .limit(30);

            if (!unsceenmessage) {
                return res.status(404).json({ success: false, message: "no such message find " });
            }
            const nextCursor =
                messages.length > 0
                    ? messages[messages.length - 1]._id
                    : null;

            return res.status(200).json({ success: true, message: unsceenmessage, hasmore: nextCursor ? true : false, nextCursor: nextCursor });
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const numberofunsceenmsginfinalgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const groupid = req.params.groupid
        if (!groupid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }
        if (!token) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const last = await lastsceenmodel.findOne({ user: userid._id, finalgroup: groupid })
        const lastsceentime = last.createdAt
        const unseenmessage = await finalmessageModel.countDocuments({
            groupid: groupid,
            createdAt: { $gt: lastsceentime }
        })
        if (!unsceenmessage) {
            return res.status(200).json({ success: false, message: "no unsceen message find " });
        }
        return res.status(200).json({ success: true, message: unsceenmessage });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showoldmessage = async (req, res) => {
    try {
        const token = req.cookies.accesstoken
        const groupid = req.params.groupid
        if (!groupid) {
            return res.status(404).json({ success: false, message: "all the fields are required" })
        }
        if (!token) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const group = await finalChatModel.findById(groupid).select('members admin _id groupname')
        if (!group) {
            return res.status(404).json({ success: false, message: "no such group find " });
        }

        if (group.members.some(member => member.equals(userid._id))) {
            const lastsceen = await lastsceenmodel.findOne({ user: userid._id, finalgroup: groupid })
            if (!lastsceen) {
                const lastsceentime = Date.now()
            }
            else {
                const lastsceentime = lastsceen.createdAt
            }
            const query = {
                groupid,
                _id: { $lt: cursor }
            };

            const messages = await finalmessageModel
                .find(query)
                .sort({ _id: -1 })
                .limit(30);

            if (!messages) {
                return res.status(404).json({ success: false, message: "no such message find " });
            }
            const nextCursor =
                messages.length > 0
                    ? messages[messages.length - 1]._id
                    : null;

            return res.status(200).json({ success: true, message: messages.reverse(), hasmore: nextCursor ? true : false, nextCursor: nextCursor });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}
