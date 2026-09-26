

import "dotenv/config";

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
      
     origin:process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


await connectdb();

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SplitUp backend is healthy",
  });
});
app.use(router);


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    
     origin:process.env.FRONTEND_URL,
    credentials: true,
  },
});

registerBaseSocket(io);


const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SplitUp backend is running on port ${PORT}`);
});