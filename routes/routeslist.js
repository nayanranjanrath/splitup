import express from "express"
const router = express.Router();
import { registeruser,verifyuser,loginuser}  from "../controller/controllers.js";
import {avatarUpload,postUpload} from "../middlewares/multer.js"

console.log(typeof registeruser);
console.log(typeof avatarUpload);

 router.post("/register",avatarUpload.single("avatar"),registeruser)
 router.post("/verifyuser",verifyuser)
 router.post("/login",loginuser)

export default router