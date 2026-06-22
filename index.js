import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./routes/routeslist.js";
import connectdb   from "./database/db.js";
import cookieParser from "cookie-parser";

app.use(cookieParser());
const app = express();
app.use(express.json());
connectdb();
const port = 3000;
app.use(router);
app.get("/", (req, res) => {
    res.send("Hello World !");
})

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});