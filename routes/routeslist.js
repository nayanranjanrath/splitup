import express from "express"
const router = express.Router();
import { registeruser } from "../controller/controllers";
import {avatarUpload,postUpload} from "../middlewares/multer.js"



 router.post("/register",avatarUpload("avatar"),registeruser )

export default router