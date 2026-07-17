import cookie from "cookie";
import { extractuserid } from "../controller/controllers.js";
import registerRequestChat from "./tempchat.socket.js";
import usermodel from "../models/user.model.js";


export default function registerBaseSocket(io) {
    io.use(async (socket, next) => {

        try {

            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const userid = extractuserid(cookies.accesstoken);
            if (!userid) {
                return next(new Error("Unauthorized"));
            }
            const user = await usermodel.findById(userid._id)
                .select("profilename avatar");
            if (!user) {
                return next(new Error("Unauthorized"));
            }
            socket.avatar = user.avatar;
            socket.profilename = user.profilename;

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