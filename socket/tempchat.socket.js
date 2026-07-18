import tempchatmodel from "../models/tempchat.model.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import messageModel from "../models/message.model.js";
import { encryptMessage, decryptMessage } from "../utility/messageencryption.js";
export default function registerRequestChat(io, socket) {

    socket.on("join-room", async (data) => {

        try {
            console.log("join room reached");
            const { requestId } = data;
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
                request.requister.equals(userId) ||
                request.members.some(member => member.equals(userId));

            if (!allowed) {
                return socket.emit("message-error", {
                    message: "You are not allowed to send messages."
                });
            }
            socket.join(room._id.toString());
            socket.currentRoom = room._id;
            socket.emit("joined-room", {
                roomId: room._id
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
            const request = await platformsharerequestmodel.findById(room.request);
            if (!request) {
                return socket.emit("message-error", {
                    message: "No request found."
                });
            }
            const allowed =
                request.requister.equals(socket.userId) ||
                request.members.some(member => member.equals(socket.userId));

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


            const afterencription = encryptMessage(data.message.trim());
            const savedMessage = await messageModel.create({

                room: room._id,

                sender: socket.userId,

                encryptedmessage: afterencription.encryptedMessage,
                iv: afterencription.iv,
                authTag: afterencription.authTag

            });

            // const populatedMessage = await savedMessage.populate(
            //     "sender",
            //     "profilename avatar"
            // )
            // const response = populatedMessage.toObject();
            // response.message = decryptMessage(
            //     response.encryptedmessage,
            //     response.iv,
            //     response.authTag
            // );
           
            const response = savedMessage.toObject();
            response.message = data.message.trim();
            response.sender = {
                _id: socket.userId,
                profilename: socket.profilename,
                avatar: socket.avatar
            };
             delete response.encryptedmessage;
            delete response.iv;
            delete response.authTag;
            delete response.__v;
            delete response._id;
            delete response.expiresAt;

            io.to(room._id.toString())
                .emit("receive-message", response);

        } catch (error) {
            console.log(error);
            return socket.emit("message-error", {
                message: "internal server error."
            });
        }
    });

    socket.on("disconnect", () => {

        console.log(socket.id, "left");

    });
}
