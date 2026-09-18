import express from "express"
import { ratelimiter } from "../middlewares/redisratelimiter.js";
const router = express.Router();
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { registeruser,getuseravatar,verifyuser,loginuser,revalidateuser,logoutuser,platformsplitrequest,selectplatform,createplatform ,selectcategory,createcategory,showallplatform,showallcategory,detailsofplatform,showprofile,rateuser,showreviews,editrating,showrequest,applyforrequest,showapplicants,acceptapplicant,showrequeststatus,removeapplicant,deleterequest,myrequest,myapply,showalredyratedornot,showplatformimage,addplatformimage,alredyappliedornot,addupiid,updateupiid,showupiid,showrequestdetails,deletefalserequests,saverequest,showsavedrequests,alredysavedornot}  from "../controller/controllers.js";
import {reportuser,reportabug,showreports,showbugs,validatereport,validatebugs}from "../controller/report.controller.js"
import {avatarUpload,postUpload} from "../middlewares/multer.js"
import{getunsceenfinalgroupmessaeg,numberofunsceenmsginfinalgroup,showoldmessage,getunsceentempgroupmessaeg,numberofunsceenmsgintempgroup,showoldmessageoftempgroup }from "../controller/chat.controller.js"
import{showallgroup, sendpaymentproof,aproveusers,rejectusers,showallproofimage}from "../controller/tempgroup.controller.js"
import {googleAuth,adduserdetails,avilibleprofilename} from "../controller/googleauth.controller.js"
import { getnotification,getnotificationcount } from "../controller/notification.controller.js"
import{showalladmingroups,addnewgroup,addmembers,selectplatformtofinalgroup,addplan,addsignindetails,deletegrouprequest,acceptdeleterequest,rejectdeleterequest,showdeleterequest,showlogindetails,showplansofafinalgroup,addfinalgroupavatar}from "../controller/finalgroup.controller.js"
import { fromArrayBufferToHex } from "google-auth-library/build/src/crypto/shared.js";

 router.post("/register", avatarUpload.single("avatar"), registeruser);

router.post("/googleauth", googleAuth);

router.post("/adduserdetails", authMiddleware, adduserdetails);

router.get("/avilibleprofilename/:profilename", avilibleprofilename);

router.post("/verifyuser", verifyuser);

router.post("/login", loginuser);

router.post("/revalidateuser", revalidateuser);

router.get("/getuseravatar", authMiddleware, getuseravatar);

router.post("/logoutuser", logoutuser);

router.post(
    "/platformsplit",
    authMiddleware,
    postUpload.array("proofimages", 2),
    platformsplitrequest
);

router.post("/selectplatform", authMiddleware, selectplatform);

router.post("/createplatform", authMiddleware, createplatform);

router.post("/selectcategory", selectcategory);

router.post("/createcategory", authMiddleware, createcategory);

router.post("/rateuser", authMiddleware, rateuser);

router.post("/editrating", authMiddleware, editrating);

router.post("/applyforrequest", authMiddleware, applyforrequest);

router.get(
    "/alredyappliedornot/:requestid",
    authMiddleware,
    alredyappliedornot
);

router.get("/showallcategory", showallcategory);

router.get("/showallplatform", showallplatform);

router.get("/detailsofplatform/:platformid", detailsofplatform);

router.get("/showprofile/:userid", showprofile);

router.get("/showreviews/:userid", showreviews);

router.get(
    "/showalredyratedornot/:rateduserid",
    authMiddleware,
    showalredyratedornot
);

router.get("/showrequest", showrequest);

router.get(
    "/showapplicants/:requestid",
    authMiddleware,
    showapplicants
);

router.get(
    "/showrequeststatus/:requestid",
    authMiddleware,
    showrequeststatus
);

router.get("/showreports", authMiddleware, showreports);

router.get("/showbugs", authMiddleware, showbugs);

router.get("/myapply", authMiddleware, myapply);

router.get("/showallgroup", authMiddleware, showallgroup);

router.post(
    "/sendpaymentproof",
    authMiddleware,
    postUpload.single("proofimage"),
    sendpaymentproof
);

router.post("/aproveusers", authMiddleware, aproveusers);

router.post("/rejectusers", authMiddleware, rejectusers);

router.get(
    "/showallproofimage/:requestid",
    authMiddleware,
    showallproofimage
);

router.get(
    "/showplatformimage/:platformid",
    showplatformimage
);

router.get("/myrequest", authMiddleware, myrequest);

router.post("/acceptapplicant", authMiddleware, acceptapplicant);

router.post("/removeapplicant", authMiddleware, removeapplicant);

router.post("/reportuser", authMiddleware, reportuser);

router.post("/reportabug", authMiddleware, reportabug);

router.post("/validatereport", authMiddleware, validatereport);

router.post("/validatebugs", authMiddleware, validatebugs);

router.post("/deleterequest", authMiddleware, deleterequest);

router.post(
    "/addplatformimage",
    authMiddleware,
    avatarUpload.single("platformimage"),
    addplatformimage
);

router.get(
    "/showalladmingroups",
    authMiddleware,
    showalladmingroups
);

router.post(
    "/addnewgroup",
    authMiddleware,
    addnewgroup
);

router.post(
    "/addmembers",
    authMiddleware,
    addmembers
);

router.post(
    "/selectplatformtofinalgroup",
    authMiddleware,
    selectplatformtofinalgroup
);

router.post(
    "/addplan",
    authMiddleware,
    addplan
);

router.post(
    "/addsignindetails",
    authMiddleware,
    addsignindetails
);

router.get(
    "/showplansofafinalgroup/:groupid",
    showplansofafinalgroup
);

router.post(
    "/deletegrouprequest",
    authMiddleware,
    deletegrouprequest
);

router.post(
    "/acceptdeleterequest",
    authMiddleware,
    acceptdeleterequest
);

router.post(
    "/rejectdeleterequest",
    authMiddleware,
    rejectdeleterequest
);

router.get(
    "/showdeleterequest/:groupid",
    showdeleterequest
);

router.get(
    "/showlogindetails/:planid",
    authMiddleware,
    showlogindetails
);

router.get(
    "/getnotification",
    authMiddleware,
    getnotification
);

router.get(
    "/getnotificationcount",
    authMiddleware,
    getnotificationcount
);

router.get(
    "/getunsceenfinalgroupmessaeg/:groupid",
    authMiddleware,
    getunsceenfinalgroupmessaeg
);

router.get(
    "/numberofunsceenmsginfinalgroup/:groupid",
    authMiddleware,
    numberofunsceenmsginfinalgroup
);

router.get(
    "/showoldmessage/:groupid",
    authMiddleware,
    showoldmessage
);

router.get(
    "/getunsceentempgroupmessaeg/:groupid",
    authMiddleware,
    getunsceentempgroupmessaeg
);

router.get(
    "/numberofunsceenmsgintempgroup/:groupid",
    authMiddleware,
    numberofunsceenmsgintempgroup
);

router.get(
    "/showoldmessageoftempgroup/:groupid",
    authMiddleware,
    showoldmessageoftempgroup
);

router.post(
    "/addupiid",
    authMiddleware,
    addupiid
);

router.post(
    "/updateupiid",
    authMiddleware,
    updateupiid
);

router.get(
    "/showupiid/:userid",
    showupiid
);

router.get(
    "/showrequestdetails/:requestid",
    
    showrequestdetails
);

router.post(
    "/deletefalserequests",
    
    deletefalserequests
);

router.post(
    "/saverequest",
    authMiddleware,
    saverequest
);

router.get(
    "/showsavedrequests",
    authMiddleware,
    showsavedrequests
);

router.get(
    "/alredysavedornot/:requestid",
    authMiddleware,
    alredysavedornot
);
router.post(
    "/addfinalgroupavatar/:groupid",
    authMiddleware,
    avatarUpload.single("avatar"),
    addfinalgroupavatar
);
export default router;