import lastsceenmodel from "../models/lastsceen.controller";
import finalmessageModel from "../models/finalgroupmessage.model";
import finalChatModel from "../models/finalchat.model";
import tempChatModel from "../models/tempchat.model";
import messageModel from "../models/message.model";
import { extractuserid } from "./controllers.js"



export const getunsceenfinalgroupmessaeg = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const groupid = req.params.groupid;
        const cursor = req.query.cursor;

        if (!groupid) {
            return res.status(400).json({
                success: false,
                message: "groupid is required"
            });
        }

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
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
            .select("members admin _id groupname");

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "No such group found"
            });
        }

        const isMember = group.members.some(member =>
            member.equals(userid._id)
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        const lastsceen = await lastsceenmodel.findOne({
            user: userid._id,
            finalgroup: groupid
        });

        let lastsceentime;

        if (!lastsceen) {
            
            lastsceentime = new Date(0);
        } else {
            lastsceentime = lastsceen.createdAt;
        }

        const query = {
            groupid,
            createdAt: {
                $gt: lastsceentime
            }
        };

        
        if (cursor) {
            query._id = {
                $gt: cursor
            };
        }

        const unsceenmessage = await finalmessageModel
            .find(query)
            .sort({ _id: 1 })
            .limit(30);

        const nextCursor =
            unsceenmessage.length > 0
                ? unsceenmessage[unsceenmessage.length - 1]._id
                : null;

        return res.status(200).json({
            success: true,
            messages: unsceenmessage,
            hasMore: unsceenmessage.length === 30,
            nextCursor
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
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
        const token = req.cookies.accesstoken;
        const groupid = req.params.groupid;
        const cursor = req.query.cursor;

        if (!groupid || !cursor) {
            return res.status(400).json({
                success: false,
                message: "groupid and cursor are required"
            });
        }

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
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
            .select("members admin _id groupname");

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "No such group found"
            });
        }

        const isMember = group.members.some(member =>
            member.equals(userid._id)
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        const messages = await finalmessageModel
            .find({
                groupid,
                _id: { $lt: cursor }
            })
            .sort({ _id: -1 })
            .limit(30);

        const nextCursor =
            messages.length > 0
                ? messages[messages.length - 1]._id
                : null;

       
        messages.reverse();

        return res.status(200).json({
            success: true,
            messages,
            hasMore: messages.length === 30,
            nextCursor
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};