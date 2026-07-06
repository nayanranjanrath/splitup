import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();
import { registeruser,verifyuser,loginuser,revalidateuser,logoutuser,platformsplitrequest,selectplatform,createplatform ,selectcategory,createcategory,showallplatform,showallcategory,detailsofplatform}  from "../controller/controllers.js";
import {avatarUpload,postUpload} from "../middlewares/multer.js"

console.log(typeof registeruser);
console.log(typeof avatarUpload);

 router.post("/register",ratelimiter,avatarUpload.single("avatar"),registeruser)
 router.post("/verifyuser",ratelimiter,verifyuser)
 router.post("/login",ratelimiter,loginuser)
 router.post("/revalidateuser",ratelimiter,revalidateuser)
 router.post("/logoutuser",logoutuser)
 router.post("/platformsplit",postUpload.array("proofimages",2),platformsplitrequest)
 router.post("/selectplatform",selectplatform)
 router.post("/createplatform",createplatform)
 router.post("/selectcategory",selectcategory)
 router.post("/createcategory",createcategory)
 router.get("/showallcategory",showallcategory)
 router.get("/showallplatform",showallplatform)
 router.get("/detailsofplatform/:platformid",detailsofplatform)
 



export default router