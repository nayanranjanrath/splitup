
export default function registerRequestChat(io, socket) {

    socket.on("join-room", async (requestId) => {

        try {
            const room = await tempchatmodel.findOne({
                request: requestId
            });

            if (!room) {
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
            const request = await platformsharerequestmodel.findById(data.requestId);
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
            const savedMessage = await requestmessagemodel.create({

                room: room._id,

                sender: socket.userId,

                message: data.message

            });
            const populatedMessage = await savedMessage.populate(
                "sender",
                "profilename avatar"
            );

            io.to(room._id.toString())
                .emit("receive-message", populatedMessage);

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
