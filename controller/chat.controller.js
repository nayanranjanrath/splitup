import lastsceenmodel from "../models/lastsceen.controller";
import finalmessageModel from "../models/finalgroupmessage.model";
import finalChatModel from "../models/finalchat.model";
import tempChatModel from "../models/tempchat.model";
import messageModel from "../models/message.model";
import platformsharerequestmodel from "../models/platformsharerequest.model";
import { decryptMessage } from "../utility/messageencryption.js";



// ============================================================
// GET UNSEEN MESSAGES FROM FINAL GROUP
// ============================================================

export const getunsceenfinalgroupmessaeg = async (req, res) => {
    try {

        const groupid = req.params.groupid;
        const cursor = req.query.cursor;
        const userid = req.userId;

        if (!groupid) {
            return res.status(400).json({
                success: false,
                message: "groupid is required"
            });
        }

        if (!userid) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // ------------------------------------------------------
        // FIND FINAL GROUP
        // ------------------------------------------------------

        const group = await finalChatModel
            .findById(groupid)
            .select("members admin _id groupname");

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "No such group found"
            });
        }

        // ------------------------------------------------------
        // CHECK MEMBERSHIP
        // ------------------------------------------------------

        const isMember = group.members.some(member =>
            member.equals(userid)
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // ------------------------------------------------------
        // GET LAST SEEN TIME
        // ------------------------------------------------------

        const lastsceen = await lastsceenmodel.findOne({
            user: userid,
            finalgroup: groupid
        });

        const lastsceentime = lastsceen
            ? lastsceen.updatedAt
            : new Date(0);

        // ------------------------------------------------------
        // BUILD QUERY
        // IMPORTANT:
        // finalmessageModel uses "room", NOT "groupid"
        // ------------------------------------------------------

        const query = {
            room: groupid,

            createdAt: {
                $gt: lastsceentime
            }
        };

        // ------------------------------------------------------
        // CURSOR PAGINATION
        // ------------------------------------------------------

        if (cursor) {
            query._id = {
                $gt: cursor
            };
        }

        // ------------------------------------------------------
        // GET UNSEEN MESSAGES
        // ------------------------------------------------------

        const unsceenmessage = await finalmessageModel
            .find(query)
            .sort({
                _id: 1
            })
            .limit(30)
            .lean();

        // ------------------------------------------------------
        // NEXT CURSOR
        // ------------------------------------------------------

        const nextCursor =
            unsceenmessage.length > 0
                ? unsceenmessage[
                    unsceenmessage.length - 1
                ]._id
                : null;

        // ------------------------------------------------------
        // DECRYPT MESSAGES
        // ------------------------------------------------------

        const decryptedMessages =
            unsceenmessage.map(message => ({
                _id: message._id,

                sender: message.sender,

                message: decryptMessage(
                    message.encryptedmessage,
                    message.iv,
                    message.authTag
                ),

                createdAt: message.createdAt
            }));

        // ------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------

        return res.status(200).json({
            success: true,

            messages: decryptedMessages,

            hasMore:
                unsceenmessage.length === 30,

            nextCursor
        });

    } catch (error) {

        console.log(
            "GET UNSEEN FINAL MESSAGE ERROR:",
            error
        );

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

        const groupid = req.params.groupid;
        const userid = req.userId;

        if (!groupid) {
            return res.status(400).json({
                success: false,
                message: "groupid is required"
            });
        }

        if (!userid) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // ------------------------------------------------------
        // CHECK GROUP
        // ------------------------------------------------------

        const group = await finalChatModel
            .findById(groupid)
            .select("members _id");

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "No such group found"
            });
        }

        // ------------------------------------------------------
        // CHECK MEMBERSHIP
        // ------------------------------------------------------

        const isMember = group.members.some(member =>
            member.equals(userid)
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // ------------------------------------------------------
        // GET LAST SEEN
        // ------------------------------------------------------

        const last = await lastsceenmodel.findOne({
            user: userid,
            finalgroup: groupid
        });

        const lastsceentime = last
            ? last.updatedAt
            : new Date(0);

        // ------------------------------------------------------
        // COUNT UNSEEN
        // IMPORTANT:
        // finalmessageModel uses "room"
        // ------------------------------------------------------

        const unseenmessage =
            await finalmessageModel.countDocuments({
                room: groupid,

                createdAt: {
                    $gt: lastsceentime
                }
            });

        // ------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------

        return res.status(200).json({
            success: true,
            message: unseenmessage
        });

    } catch (error) {

        console.log(
            "COUNT FINAL UNSEEN MESSAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



// ============================================================
// SHOW OLD MESSAGES FROM FINAL GROUP
// ============================================================

export const showoldmessage = async (req, res) => {
    try {

        const groupid = req.params.groupid;
        const cursor = req.query.cursor;
        const userid = req.userId;

        if (!groupid || !cursor) {
            return res.status(400).json({
                success: false,
                message: "groupid and cursor are required"
            });
        }

        if (!userid) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // ------------------------------------------------------
        // FIND GROUP
        // ------------------------------------------------------

        const group = await finalChatModel
            .findById(groupid)
            .select("members admin _id groupname");

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "No such group found"
            });
        }

        // ------------------------------------------------------
        // CHECK MEMBERSHIP
        // ------------------------------------------------------

        const isMember = group.members.some(member =>
            member.equals(userid)
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // ------------------------------------------------------
        // GET OLD MESSAGES
        // IMPORTANT:
        // finalmessageModel uses "room"
        // ------------------------------------------------------

        const messages =
            await finalmessageModel
                .find({
                    room: groupid,

                    _id: {
                        $lt: cursor
                    }
                })
                .sort({
                    _id: -1
                })
                .limit(30)
                .lean();

        // ------------------------------------------------------
        // NEXT CURSOR
        // ------------------------------------------------------

        const nextCursor =
            messages.length > 0
                ? messages[
                    messages.length - 1
                ]._id
                : null;

        // ------------------------------------------------------
        // DECRYPT
        // ------------------------------------------------------

        const decryptedMessages =
            messages.map(message => ({
                _id: message._id,

                sender: message.sender,

                message: decryptMessage(
                    message.encryptedmessage,
                    message.iv,
                    message.authTag
                ),

                createdAt: message.createdAt
            }));

        // ------------------------------------------------------
        // DATABASE QUERY WAS NEWEST → OLDEST
        // REVERSE FOR FRONTEND
        // ------------------------------------------------------

        decryptedMessages.reverse();

        // ------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------

        return res.status(200).json({
            success: true,

            messages: decryptedMessages,

            hasMore:
                messages.length === 30,

            nextCursor
        });

    } catch (error) {

        console.log(
            "SHOW OLD FINAL MESSAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET UNSEEN MESSAGES FROM TEMP GROUP


export const getunsceentempgroupmessaeg = async (req, res) => {
    try {
        const requestid = req.params.requestid;
        const cursor = req.query.cursor;
        const userid = req.userId;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
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

        const isMember =
            group.requister?.equals(userid) ||
            group.members.some(member => member.equals(userid));

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
            user: userid,
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
        const requestid = req.params.requestid;
        const userid = req.userId;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "all the fields are required"
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
            user: userid,
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

        const groupid = req.params.requestid;
        const cursor = req.query.cursor;
        const userid = req.userId;

        if (!groupid) {
            return res.status(400).json({
                success: false,
                message: "groupid is required"
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

        // Requester or member is allowed to view messages
        const isMember =
            group.requister?.equals(userid) ||
            group.members.some(member => member.equals(userid));

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        /*
         * groupid is actually the platform share request ID.
         * messageModel.room contains the tempChatModel._id.
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

        // Build message query
        const messageQuery = {
            room: tempGroup._id
        };

        // If cursor exists, fetch messages older than the cursor
        if (cursor) {
            messageQuery._id = {
                $lt: cursor
            };
        }

        const messages = await messageModel
            .find(messageQuery)
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

        // Convert newest -> oldest into oldest -> newest
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