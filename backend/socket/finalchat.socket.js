import finalChatModel from "../models/finalchat.model.js";
import { encryptMessage } from "../utility/messageencryption.js";
import lastsceenmodel from "../models/lastsceen.controller.js";
import finalmessageModel from "../models/finalgroupmessage.model.js";

export default function registerRequestChat(io, socket) {

    /* =========================================================
       JOIN FINAL GROUP CHAT
    ========================================================= */

    socket.on("join-finalchat", async (data) => {
        try {
            console.log("join-finalchat reached");

            const { groupid } = data || {};

            if (!groupid) {
                return socket.emit("message-error", {
                    message: "Group ID is required."
                });
            }

            const group = await finalChatModel.findById(groupid);

            if (!group) {
                console.log("Final group not found:", groupid);

                return socket.emit("message-error", {
                    message: "No group found."
                });
            }

            const userId = socket.userId;

            if (!userId) {
                return socket.emit("message-error", {
                    message: "Unauthorized."
                });
            }

            /* -------------------------------------------------
               CHECK WHETHER USER IS A GROUP MEMBER
            ------------------------------------------------- */

            const allowed = group.members.some((member) =>
                member.equals(userId)
            );

            if (!allowed) {
                console.log(
                    "User is not a member of this final group:",
                    userId
                );

                return socket.emit("message-error", {
                    message: "You are not allowed to access this group."
                });
            }

            /* -------------------------------------------------
               LEAVE PREVIOUS ROOM IF ANY
            ------------------------------------------------- */

            if (socket.currentRoom) {
                socket.leave(socket.currentRoom.toString());
            }

            /* -------------------------------------------------
               JOIN NEW ROOM
            ------------------------------------------------- */

            const roomId = group._id.toString();

            socket.join(roomId);

            /*
             * IMPORTANT:
             * Store the actual finalChatModel._id.
             * last-seen uses this value later.
             */
            socket.currentRoom = group._id;

            console.log(
                `User ${userId} joined final group ${roomId}`
            );

            socket.emit("joined-room", {
                roomId: group._id
            });

        } catch (error) {
            console.error(
                "JOIN FINAL CHAT ERROR:",
                error
            );

            return socket.emit("message-error", {
                message: "Internal server error."
            });
        }
    });


    /* =========================================================
       SEND FINAL GROUP MESSAGE
    ========================================================= */

    socket.on("send-final-message", async (data) => {
        try {
            console.log("send-final-message reached");

            /* -------------------------------------------------
               CHECK ROOM
            ------------------------------------------------- */

            const roomId = socket.currentRoom;

            if (!roomId) {
                console.log("No current room for socket");

                return socket.emit("message-error", {
                    message: "No room found."
                });
            }

            /* -------------------------------------------------
               CHECK USER
            ------------------------------------------------- */

            if (!socket.userId) {
                return socket.emit("message-error", {
                    message: "Unauthorized."
                });
            }

            /* -------------------------------------------------
               VALIDATE MESSAGE
            ------------------------------------------------- */

            const message =
                typeof data?.message === "string"
                    ? data.message.trim()
                    : "";

            if (!message) {
                return socket.emit("message-error", {
                    message: "Message cannot be empty."
                });
            }

            if (message.length > 1000) {
                return socket.emit("message-error", {
                    message: "Message is too long."
                });
            }

            /* -------------------------------------------------
               FIND FINAL GROUP
            ------------------------------------------------- */

            const room =
                await finalChatModel.findById(roomId);

            if (!room) {
                console.log(
                    "Final group not found while sending:",
                    roomId
                );

                return socket.emit("message-error", {
                    message: "No room found."
                });
            }

            /* -------------------------------------------------
               CHECK MEMBERSHIP AGAIN
            ------------------------------------------------- */

            const allowed =
                room.members.some((member) =>
                    member.equals(socket.userId)
                );

            if (!allowed) {
                console.log(
                    "User is not allowed to send message:",
                    socket.userId
                );

                return socket.emit("message-error", {
                    message: "You are not allowed to send messages."
                });
            }

            /* -------------------------------------------------
               ENCRYPT MESSAGE
            ------------------------------------------------- */

            const encrypted =
                encryptMessage(message);

            console.log("Encryption completed");

            /*
             * Expected encryption result:
             *
             * {
             *   encryptedMessage,
             *   iv,
             *   authTag
             * }
             */

            if (
                !encrypted ||
                !encrypted.encryptedMessage ||
                !encrypted.iv ||
                !encrypted.authTag
            ) {
                console.error(
                    "Invalid encryption result:",
                    encrypted
                );

                return socket.emit("message-error", {
                    message: "Message encryption failed."
                });
            }

            /* -------------------------------------------------
               SAVE TO DATABASE
            ------------------------------------------------- */

            console.log("Attempting to save final message...");

            /*
             * IMPORTANT:
             *
             * Your schema uses:
             *
             * room: ObjectId
             *
             * so we MUST use room here.
             */

            const savedMessage =
                await finalmessageModel.create({
                    room: room._id,
                    sender: socket.userId,
                    encryptedmessage:
                        encrypted.encryptedMessage,
                    iv: encrypted.iv,
                    authTag:
                        encrypted.authTag
                });

            console.log(
                "FINAL MESSAGE SAVED:",
                savedMessage._id.toString()
            );

            /* -------------------------------------------------
               BUILD RESPONSE FOR FRONTEND
            ------------------------------------------------- */

            const response =
                savedMessage.toObject();

            /*
             * Send decrypted text to the connected users.
             */

            response.message = message;

            /*
             * Sender information.
             *
             * socket.profilename and socket.avatar should be
             * populated by your socket authentication middleware.
             */

            response.sender = {
                _id: socket.userId,
                profilename: socket.profilename || "",
                avatar: socket.avatar || ""
            };

            /* -------------------------------------------------
               REMOVE PRIVATE ENCRYPTION DATA
            ------------------------------------------------- */

            delete response.encryptedmessage;
            delete response.iv;
            delete response.authTag;
            delete response.__v;
            delete response.expiresAt;

            /*
             * DO NOT DELETE response._id
             *
             * Your frontend uses _id to deduplicate messages.
             */

            /* -------------------------------------------------
               SEND MESSAGE TO EVERYONE IN THE GROUP
            ------------------------------------------------- */

            io.to(room._id.toString()).emit(
                "receive-message",
                response
            );

            console.log(
                "Final message emitted:",
                savedMessage._id.toString()
            );

        } catch (error) {
            console.error(
                "FINAL CHAT SEND ERROR:"
            );

            console.error(error);

            /*
             * During debugging, send the actual error message
             * to the frontend too.
             */

            return socket.emit("message-error", {
                message:
                    error?.message ||
                    "Internal server error."
            });
        }
    });


    /* =========================================================
       DISCONNECT
    ========================================================= */

    socket.on("disconnect", async () => {
        try {
            console.log(
                "Socket disconnected:",
                socket.id
            );

            /*
             * Socket may disconnect without joining any
             * final group.
             */

            if (!socket.userId || !socket.currentRoom) {
                console.log(
                    "No final group to update last-seen."
                );

                return;
            }

            const roomId =
                socket.currentRoom;

            /* -------------------------------------------------
               FIND EXISTING LAST-SEEN RECORD
            ------------------------------------------------- */

            const existinglastsceen =
                await lastsceenmodel.findOne({
                    user: socket.userId,
                    finalgroup: roomId
                });

            /* -------------------------------------------------
               UPDATE LAST-SEEN
            ------------------------------------------------- */

            if (existinglastsceen) {

                existinglastsceen.updatedAt =
                    new Date();

                await existinglastsceen.save();

                console.log(
                    "Last seen updated:",
                    socket.userId,
                    roomId.toString()
                );

            } else {

                await lastsceenmodel.create({
                    user: socket.userId,
                    finalgroup: roomId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(
                    "Last seen created:",
                    socket.userId,
                    roomId.toString()
                );
            }

        } catch (error) {
            console.error(
                "FINAL CHAT DISCONNECT ERROR:",
                error
            );
        }
    });
}