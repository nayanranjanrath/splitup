import express from "express"
const router = express.Router();
import { registeruser,verifyuser,loginuser,revalidateuser,logoutuser}  from "../controller/controllers.js";
import {avatarUpload,postUpload} from "../middlewares/multer.js"

console.log(typeof registeruser);
console.log(typeof avatarUpload);

 router.post("/register",avatarUpload.single("avatar"),registeruser)
 router.post("/verifyuser",verifyuser)
 router.post("/login",loginuser)
 router.post("/revalidateuser",revalidateuser)
 router.post("/logoutuser",logoutuser)


export default router