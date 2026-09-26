import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { Server } from "socket.io";

import router from "./routes/routeslist.js";
import connectdb from "./database/db.js";

import "./utility/cron/deletecloudinary.js";

import registerBaseSocket from "./socket/base.socket.js";

const app = express();




app.use(
  cors({
      
     origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


connectdb();
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  console.log("BODY:", req.body);
  next();
});

app.use(router);


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    
     origin: "http://localhost:5173",
    credentials: true,
  },
});

registerBaseSocket(io);


const port = 3000;

server.listen(port,"0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});