import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();
import { registeruser,verifyuser,loginuser,revalidateuser,logoutuser}  from "../controller/controllers.js";
import {avatarUpload,postUpload} from "../middlewares/multer.js"

console.log(typeof registeruser);
console.log(typeof avatarUpload);

 router.post("/register",ratelimiter,avatarUpload.single("avatar"),registeruser)
 router.post("/verifyuser",ratelimiter,verifyuser)
 router.post("/login",ratelimiter,loginuser)
 router.post("/revalidateuser",ratelimiter,revalidateuser)
 router.post("/logoutuser",logoutuser)


export default router