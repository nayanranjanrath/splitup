import cookie from "cookie";

import { extractuserid } from "../controller/controllers.js";

import registerTempChat from "./tempchat.socket.js";
import registerFinalChat from "./finalchat.socket.js";

import usermodel from "../models/user.model.js";


export default function registerBaseSocket(io) {

    /* =========================================================
       SOCKET AUTHENTICATION MIDDLEWARE
    ========================================================= */

    io.use(async (socket, next) => {

        try {

            console.log(
                "Socket authentication started:",
                socket.id
            );

            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const accessToken =
                cookies.accesstoken;

            if (!accessToken) {

                console.log(
                    "Socket authentication failed: no access token"
                );

                return next(
                    new Error("Unauthorized")
                );
            }

            /* -------------------------------------------------
               DECODE / VERIFY ACCESS TOKEN
            ------------------------------------------------- */

            const decodedUser =
                extractuserid(accessToken);

            if (!decodedUser?._id) {

                console.log(
                    "Socket authentication failed: invalid token"
                );

                return next(
                    new Error("Unauthorized")
                );
            }

            /* -------------------------------------------------
               FIND USER
            ------------------------------------------------- */

            const user =
                await usermodel
                    .findById(decodedUser._id)
                    .select("profilename avatar");

            if (!user) {

                console.log(
                    "Socket authentication failed: user not found"
                );

                return next(
                    new Error("Unauthorized")
                );
            }

            /* -------------------------------------------------
               ATTACH USER DATA TO SOCKET
            ------------------------------------------------- */

            socket.userId =
                user._id;

            socket.profilename =
                user.profilename || "";

            socket.avatar =
                user.avatar || "";

            console.log(
                "Socket authenticated:",
                socket.userId.toString()
            );

            next();

        } catch (error) {

            console.error(
                "SOCKET AUTH ERROR:",
                error
            );

            return next(
                new Error("Unauthorized")
            );
        }

    });


    /* =========================================================
       SOCKET CONNECTION
    ========================================================= */

    io.on("connection", (socket) => {

        console.log(
            "Connected:",
            socket.id,
            "User:",
            socket.userId?.toString()
        );


        /* =====================================================
           REGISTER TEMPORARY CHAT EVENTS
        ===================================================== */

        registerTempChat(
            io,
            socket
        );


        /* =====================================================
           REGISTER FINAL GROUP CHAT EVENTS
        ===================================================== */

        registerFinalChat(
            io,
            socket
        );

    });

}