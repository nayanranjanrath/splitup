import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();

import { registeruser,verifyuser,loginuser,revalidateuser,logoutuser,platformsplitrequest,selectplatform,createplatform ,selectcategory,createcategory,showallplatform,showallcategory,detailsofplatform,showprofile,rateuser,showreviews,editrating,showrequest,applyforrequest,showapplicants,acceptapplicant,showrequeststatus,removeapplicant}  from "../controller/controllers.js";
import {avatarUpload,postUpload} from "../middlewares/multer.js"

console.log(typeof registeruser);
console.log(typeof avatarUpload);

 router.post("/register",avatarUpload.single("avatar"),registeruser)
 router.post("/verifyuser",verifyuser)
 router.post("/login",loginuser)
 router.post("/revalidateuser",revalidateuser)
 router.post("/logoutuser",logoutuser)
 router.post("/platformsplit",postUpload.array("proofimages",2),platformsplitrequest)
 router.post("/selectplatform",selectplatform)
 router.post("/createplatform",createplatform)
 router.post("/selectcategory",selectcategory)
 router.post("/createcategory",createcategory)
 router.post("/rateuser",rateuser)
 router.post("/editrating",editrating)
 router.post("/applyforrequest",applyforrequest)
 router.get("/showallcategory",showallcategory)
 router.get("/showallplatform",showallplatform)
 router.get("/detailsofplatform/:platformid",detailsofplatform)
 router.get("/showprofile/:userid",showprofile)
 router.get("/showreviews/:userid",showreviews)
 router.get("/showrequest",showrequest) 
 router.get("/showapplicants/:requestid",showapplicants)
 router.get("/showrequeststatus/:requestid",showrequeststatus)
 router.post("/acceptapplicant",acceptapplicant)
 router.post("/removeapplicant",removeapplicant)

export default router