import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();

import { registeruser,verifyuser,loginuser,revalidateuser,logoutuser,platformsplitrequest,selectplatform,createplatform ,selectcategory,createcategory,showallplatform,showallcategory,detailsofplatform,showprofile,rateuser,showreviews,editrating,showrequest,applyforrequest,showapplicants,acceptapplicant,showrequeststatus,removeapplicant,deleterequest,myrequest,myapply}  from "../controller/controllers.js";
import {reportuser,reportabug,showreports,showbugs,validatereport,validatebugs}from "../controller/report.controller.js"
import {avatarUpload,postUpload} from "../middlewares/multer.js"
import{showallgroup}from "../controller/tempgroup.controller.js"
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
 router.get("/showreports",showreports)
 router.get("/showbugs",showbugs)
 router.get("/myapply",myapply)
 router.get("/showallgroup",showallgroup)
 
 router.get("/myrequest",myrequest)
 router.post("/acceptapplicant",acceptapplicant)
 router.post("/removeapplicant",removeapplicant)
 router.post("/reportuser",reportuser)
 router.post("/reportabug",reportabug)
 router.post("/validatereport",validatereport)
 router.post("/validatebugs",validatebugs)
 router.post("/deleterequest",deleterequest)

export default router