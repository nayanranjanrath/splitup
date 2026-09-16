import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();

import { registeruser,getuseravatar,verifyuser,loginuser,revalidateuser,logoutuser,platformsplitrequest,selectplatform,createplatform ,selectcategory,createcategory,showallplatform,showallcategory,detailsofplatform,showprofile,rateuser,showreviews,editrating,showrequest,applyforrequest,showapplicants,acceptapplicant,showrequeststatus,removeapplicant,deleterequest,myrequest,myapply,showalredyratedornot,showplatformimage,addplatformimage,alredyappliedornot,addupiid,updateupiid,showupiid}  from "../controller/controllers.js";
import {reportuser,reportabug,showreports,showbugs,validatereport,validatebugs}from "../controller/report.controller.js"
import {avatarUpload,postUpload} from "../middlewares/multer.js"
import{getunsceenfinalgroupmessaeg,numberofunsceenmsginfinalgroup,showoldmessage,getunsceentempgroupmessaeg,numberofunsceenmsgintempgroup,showoldmessageoftempgroup }from "../controller/chat.controller.js"
import{showallgroup, sendpaymentproof,aproveusers,rejectusers,showallproofimage}from "../controller/tempgroup.controller.js"
import {googleAuth,adduserdetails,avilibleprofilename} from "../controller/googleauth.controller.js"
import { getnotification,getnotificationcount } from "../controller/notification.controller.js"
import{showalladmingroups,addnewgroup,addmembers,selectplatformtofinalgroup,addplan,addsignindetails,deletegrouprequest,acceptdeleterequest,rejectdeleterequest,showdeleterequest,showlogindetails,showplansofafinalgroup}from "../controller/finalgroup.controller.js"
import { fromArrayBufferToHex } from "google-auth-library/build/src/crypto/shared.js";

 router.post("/register",avatarUpload.single("avatar"),registeruser)   //done
 router.post("/googleauth",googleAuth)  //done
 router.post("/adduserdetails",adduserdetails)  //done
 router.get("/avilibleprofilename/:profilename",avilibleprofilename)  //done
 router.post("/verifyuser",verifyuser)  //done
 router.post("/login",loginuser) //done
 router.post("/revalidateuser",revalidateuser)  //done
router.get("/getuseravatar",getuseravatar)   //done
 router.post("/logoutuser",logoutuser) //done 
 router.post("/platformsplit",postUpload.array("proofimages",2),platformsplitrequest) //done
 router.post("/selectplatform",selectplatform) //done
 router.post("/createplatform",createplatform) //done
 router.post("/selectcategory",selectcategory) //done
 router.post("/createcategory",createcategory) //done
 router.post("/rateuser",rateuser) //done
 router.post("/editrating",editrating)  //done
 router.post("/applyforrequest",applyforrequest) //done
 router.get("/alredyappliedornot/:requestid",alredyappliedornot)
 router.get("/showallcategory",showallcategory) //done
 router.get("/showallplatform",showallplatform) //done
 router.get("/detailsofplatform/:platformid",detailsofplatform) //done
 router.get("/showprofile/:userid",showprofile) //done
 router.get("/showreviews/:userid",showreviews) //done
 router.get("/showalredyratedornot/:rateduserid",showalredyratedornot)  //done
 router.get("/showrequest",showrequest) //done
 router.get("/showapplicants/:requestid",showapplicants) // done 
 router.get("/showrequeststatus/:requestid",showrequeststatus) //done
 router.get("/showreports",showreports)
 router.get("/showbugs",showbugs)
 router.get("/myapply",myapply) //done
 router.get("/showallgroup",showallgroup) //done
 router.post("/sendpaymentproof",postUpload.single("proofimage"), sendpaymentproof) //done
 router.post("/aproveusers", aproveusers)//done
 router.post("/rejectusers", rejectusers) //done 
 router.get("/showallproofimage/:requestid", showallproofimage) //done 
 router.get("/showplatformimage/:platformid", showplatformimage) //done
 router.get("/myrequest",myrequest) //done
 router.post("/acceptapplicant",acceptapplicant) //done
 router.post("/removeapplicant",removeapplicant) //done
 router.post("/reportuser",reportuser) //done 
 router.post("/reportabug",reportabug) //done
 router.post("/validatereport",validatereport)
 router.post("/validatebugs",validatebugs)
 router.post("/deleterequest",deleterequest) //done

router.post("/addplatformimage",avatarUpload.single("platformimage"),addplatformimage) //done
 router.get("/showalladmingroups",showalladmingroups) //done
router.post("/addnewgroup",addnewgroup) //done
router.post("/addmembers",addmembers) //done

router.post("/selectplatformtofinalgroup",selectplatformtofinalgroup)//done
router.post("/addplan",addplan)//done
router.post("/addsignindetails",addsignindetails)//done
router.get("/showplansofafinalgroup/:groupid",showplansofafinalgroup)//done
router.post("/deletegrouprequest",deletegrouprequest)//done 
router.post("/acceptdeleterequest",acceptdeleterequest)//done
router.post("/rejectdeleterequest",rejectdeleterequest) //done 
router.get("/showdeleterequest/:groupid",showdeleterequest)//done 
router.get("/showlogindetails/:planid",showlogindetails)//done 
router.get("/getnotification",getnotification)  //done
router.get("/getnotificationcount",getnotificationcount) //done
router.get("/getunsceenfinalgroupmessaeg/:groupid",getunsceenfinalgroupmessaeg) //done
router.get("/numberofunsceenmsginfinalgroup/:groupid",numberofunsceenmsginfinalgroup)  //done
router.get("/showoldmessage/:groupid",showoldmessage)  //done
router.get("/getunsceentempgroupmessaeg/:groupid",getunsceentempgroupmessaeg) //done
router.get("/numberofunsceenmsgintempgroup/:groupid",numberofunsceenmsgintempgroup)  //done
router.get("/showoldmessageoftempgroup/:groupid",showoldmessageoftempgroup) //done

router.post("/addupiid",addupiid) //done
router.post("/updateupiid",updateupiid) //done
router.get("/showupiid/:userid",showupiid) //done
export default router