import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import dotenv from "dotenv";
dotenv.config()
import http from "http"
import { Server } from "socket.io";
import express from "express";
import router from "./routes/routeslist.js";
import connectdb   from "./database/db.js";
import cookieParser from "cookie-parser";
import "./utility/cron/deletecloudinary.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server)

app.use(express.json());
app.use(cookieParser());
connectdb();
const port = 3000;
app.use(router);
app.get("/", (req, res) => {
    res.send("Hello World !");
})

server.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});