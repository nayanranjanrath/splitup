import cookie from "cookie";
import { extractuserid } from "./controller/controllers.js";




export default function registerBaseSocket(io) {
    io.use((socket, next) => {

        try {

            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const userid = extractuserid(cookies.accesstoken);
 if (!userid) {
                return next(new Error("Unauthorized"));
            }
           

            socket.userId = userid._id;

            next();

        } catch (error) {

            next(new Error("Unauthorized"));

        }

    });
   
    io.on("connection", (socket) => {

        console.log("Connected:", socket.id);

        registerRequestChat(io, socket);

    });

}