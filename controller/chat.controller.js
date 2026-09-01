import lastsceenmodel from "../models/lastsceen.controller";
import finalmessageModel from "../models/finalgroupmessage.model";
import finalChatModel from "../models/finalchat.model";
import tempChatModel from "../models/tempchat.model";
import messageModel from "../models/message.model";
import platformsharerequestmodel from "../models/platformsharerequest.model";
import { extractuserid } from "./controllers.js";
import { decryptMessage } from "../utility/messageencryption.js";


// ============================================================
// GET UNSEEN MESSAGES FROM FINAL GROUP
// ============================================================

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
            lastsceentime = lastsceen.updatedAt;
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
            .limit(30)
            .lean();

        const nextCursor =
            unsceenmessage.length > 0
                ? unsceenmessage[unsceenmessage.length - 1]._id
                : null;

        // Decrypt messages before sending them to frontend
        const decryptedMessages = unsceenmessage.map(message => ({
            _id: message._id,
            sender: message.sender,
            message: decryptMessage(
                message.encryptedmessage,
                message.iv,
                message.authTag
            ),
            createdAt: message.createdAt
        }));

        return res.status(200).json({
            success: true,
            messages: decryptedMessages,
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


// ============================================================
// NUMBER OF UNSEEN MESSAGES IN FINAL GROUP
// ============================================================

export const numberofunsceenmsginfinalgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const groupid = req.params.groupid;

        if (!groupid) {
            return res.status(404).json({
                success: false,
                message: "all the fields are required"
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

        const last = await lastsceenmodel.findOne({
            user: userid._id,
            finalgroup: groupid
        });

        // If there is no last-seen record, consider all messages unseen
        const lastsceentime = last
            ? last.updatedAt
            : new Date(0);

        const unseenmessage = await finalmessageModel.countDocuments({
            groupid: groupid,
            createdAt: {
                $gt: lastsceentime
            }
        });

        return res.status(200).json({
            success: true,
            message: unseenmessage
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
};


// ============================================================
// SHOW OLD MESSAGES FROM FINAL GROUP
// ============================================================

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
                _id: {
                    $lt: cursor
                }
            })
            .sort({ _id: -1 })
            .limit(30)
            .lean();

        const nextCursor =
            messages.length > 0
                ? messages[messages.length - 1]._id
                : null;

        // Decrypt messages
        const decryptedMessages = messages.map(message => ({
            _id: message._id,
            sender: message.sender,
            message: decryptMessage(
                message.encryptedmessage,
                message.iv,
                message.authTag
            ),
            createdAt: message.createdAt
        }));

        // We fetched newest -> oldest.
        // Reverse so frontend receives oldest -> newest.
        decryptedMessages.reverse();

        return res.status(200).json({
            success: true,
            messages: decryptedMessages,
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


// ============================================================
// GET UNSEEN MESSAGES FROM TEMP GROUP
// ============================================================

export const getunsceentempgroupmessaeg = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const requestid = req.params.requestid;
        const cursor = req.query.cursor;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
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

        const group = await platformsharerequestmodel
            .findById(requestid)
            .select("members requister _id platformname");

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

        /*
         * requestid is the platform share request ID.
         * messageModel.room stores the tempChatModel ID,
         * so first find the temp chat.
         */
        const tempGroup = await tempChatModel
            .findOne({
                request: requestid
            })
            .select("_id");

        if (!tempGroup) {
            return res.status(404).json({
                success: false,
                message: "No temporary group found"
            });
        }

        const lastsceen = await lastsceenmodel.findOne({
            user: userid._id,
            tempgroup: requestid
        });

        let lastsceentime;

        if (!lastsceen) {
            lastsceentime = new Date(0);
        } else {
            lastsceentime = lastsceen.updatedAt;
        }

        const query = {
            room: tempGroup._id,
            createdAt: {
                $gt: lastsceentime
            }
        };

        if (cursor) {
            query._id = {
                $gt: cursor
            };
        }

        const unsceenmessage = await messageModel
            .find(query)
            .sort({ _id: 1 })
            .limit(30)
            .lean();

        const nextCursor =
            unsceenmessage.length > 0
                ? unsceenmessage[unsceenmessage.length - 1]._id
                : null;

        // Decrypt messages before sending them to frontend
        const decryptedMessages = unsceenmessage.map(message => ({
            _id: message._id,
            sender: message.sender,
            message: decryptMessage(
                message.encryptedmessage,
                message.iv,
                message.authTag
            ),
            createdAt: message.createdAt
        }));

        return res.status(200).json({
            success: true,
            messages: decryptedMessages,
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


// ============================================================
// NUMBER OF UNSEEN MESSAGES IN TEMP GROUP
// ============================================================

export const numberofunsceenmsgintempgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const requestid = req.params.requestid;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "all the fields are required"
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

        /*
         * requestid is the request ID,
         * so get the temp chat first.
         */
        const tempGroup = await tempChatModel
            .findOne({
                request: requestid
            })
            .select("_id");

        if (!tempGroup) {
            return res.status(404).json({
                success: false,
                message: "No temporary group found"
            });
        }

        const last = await lastsceenmodel.findOne({
            user: userid._id,
            tempgroup: requestid
        });

        const lastsceentime = last
            ? last.updatedAt
            : new Date(0);

        const unseenmessage = await messageModel.countDocuments({
            room: tempGroup._id,
            createdAt: {
                $gt: lastsceentime
            }
        });

        return res.status(200).json({
            success: true,
            message: unseenmessage
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
};


// ============================================================
// SHOW OLD MESSAGES FROM TEMP GROUP
// ============================================================

export const showoldmessageoftempgroup = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const groupid = req.params.requestid;
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

        const group = await platformsharerequestmodel
            .findById(groupid)
            .select("members requister _id platformname");

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

        /*
         * groupid here is actually requestid.
         * messageModel.room contains tempChatModel._id,
         * so get the temp chat first.
         */
        const tempGroup = await tempChatModel
            .findOne({
                request: groupid
            })
            .select("_id");

        if (!tempGroup) {
            return res.status(404).json({
                success: false,
                message: "No temporary group found"
            });
        }

        const messages = await messageModel
            .find({
                room: tempGroup._id,
                _id: {
                    $lt: cursor
                }
            })
            .sort({ _id: -1 })
            .limit(30)
            .lean();

        const nextCursor =
            messages.length > 0
                ? messages[messages.length - 1]._id
                : null;

        // Decrypt messages
        const decryptedMessages = messages.map(message => ({
            _id: message._id,
            sender: message.sender,
            message: decryptMessage(
                message.encryptedmessage,
                message.iv,
                message.authTag
            ),
            createdAt: message.createdAt
        }));

        // Oldest -> newest for frontend
        decryptedMessages.reverse();

        return res.status(200).json({
            success: true,
            messages: decryptedMessages,
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