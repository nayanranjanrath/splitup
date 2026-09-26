import tempchatmodel from "../models/tempchat.model.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import messageModel from "../models/message.model.js";
import { encryptMessage } from "../utility/messageencryption.js";
import lastsceenmodel from "../models/lastsceen.controller.js";

export default function registerRequestChat(io, socket) {

    socket.on("join-room", async (data) => {
        try {

            console.log("join room reached");

            const { requestId } = data;

            if (!requestId) {
                return socket.emit("message-error", {
                    message: "requestId is required."
                });
            }

            const room = await tempchatmodel.findOne({
                request: requestId
            });

            if (!room) {
                console.log("room not found");

                return socket.emit("message-error", {
                    message: "no room found."
                });
            }

            const request = await platformsharerequestmodel.findById(requestId);

            if (!request) {
                return socket.emit("message-error", {
                    message: "no request found."
                });
            }

            const userId = socket.userId;

            const allowed =
                request.requister?.equals(userId) ||
                request.members.some(member => member.equals(userId));

            if (!allowed) {
                return socket.emit("message-error", {
                    message: "You are not allowed to send messages."
                });
            }

            const roomId = room._id.toString();

            socket.join(roomId);

            // tempChatModel ID
            socket.currentRoom = roomId;

            // Keep request ID as well
            socket.currentRequestId = requestId.toString();

            socket.emit("joined-room", {
                roomId: roomId
            });

        } catch (error) {

            console.log(error);

            return socket.emit("message-error", {
                message: "internal server error."
            });
        }
    });


    socket.on("send-message", async (data) => {
        try {

            const roomId = socket.currentRoom;

            if (!roomId) {
                return socket.emit("message-error", {
                    message: "no room found."
                });
            }

            const room = await tempchatmodel.findById(roomId);

            if (!room) {
                return socket.emit("message-error", {
                    message: "no room found."
                });
            }

            const request = await platformsharerequestmodel.findById(
                room.request
            );

            if (!request) {
                return socket.emit("message-error", {
                    message: "No request found."
                });
            }

            const allowed =
                request.requister?.equals(socket.userId) ||
                request.members.some(member =>
                    member.equals(socket.userId)
                );

            if (!allowed) {
                return socket.emit("message-error", {
                    message: "You are not allowed to send messages."
                });
            }

            if (!data.message?.trim()) {
                return socket.emit("message-error", {
                    message: "Message cannot be empty."
                });
            }

            if (data.message.length > 1000) {
                return socket.emit("message-error", {
                    message: "Message is too long."
                });
            }

            const afterencription = encryptMessage(
                data.message.trim()
            );

            const savedMessage = await messageModel.create({
                room: room._id,
                sender: socket.userId,
                encryptedmessage: afterencription.encryptedMessage,
                iv: afterencription.iv,
                authTag: afterencription.authTag
            });

            const response = savedMessage.toObject();

            response.message = data.message.trim();

            response.sender = {
                _id: socket.userId,
                profilename: socket.profilename,
                avatar: socket.avatar
            };

            // Keep _id so frontend can deduplicate messages
            // and identify messages uniquely.

            delete response.encryptedmessage;
            delete response.iv;
            delete response.authTag;
            delete response.__v;
            delete response.expiresAt;

            io.to(roomId).emit(
                "receive-message",
                response
            );

        } catch (error) {

            console.log(error);

            return socket.emit("message-error", {
                message: "internal server error."
            });
        }
    });


    socket.on("disconnect", async () => {

        try {

            const userId = socket.userId;
            const currentRoom = socket.currentRoom;

            // User never joined a temp room
            if (!userId || !currentRoom) {
                console.log(socket.id, "left without joining a room");
                return;
            }

            /*
             * currentRoom is tempChatModel._id.
             *
             * This matches:
             *
             * lastsceenmodel.tempgroup -> tempChatModel
             */
            const existinglastsceen = await lastsceenmodel.findOne({
                user: userId,
                tempgroup: currentRoom
            });

            if (existinglastsceen) {

                existinglastsceen.updatedAt = new Date();

                await existinglastsceen.save();

            } else {

                await lastsceenmodel.create({
                    user: userId,
                    tempgroup: currentRoom,
                    updatedAt: new Date()
                });
            }

            console.log(
                socket.id,
                "left temp room:",
                currentRoom
            );

        } catch (error) {

            console.log(
                "Error updating temp last seen:",
                error
            );
        }
    });
}