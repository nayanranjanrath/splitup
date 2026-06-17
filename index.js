import express from "express";
import router from "./routes/routeslist.js";
const app = express();
app.use(express.json());
const port = 3000;
app.use(router);
app.get("/", (req, res) => {
    res.send("Hello World !");
})

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
});