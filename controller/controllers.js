
import mongoose from "mongoose";
import { uploadtocloudinar } from "../utility/cloudinary.js"
import resize from "../utility/sharp.js";
import usermodel from "../models/user.model.js";

import fs from "fs";
import Redish from "ioredis";
const redis = new Redish("redis://localhost:6379");
import { sendOTPEmail } from "../utility/nodemailer.js";
import { secureHeapUsed } from "crypto";

const generateaccessandrefreshtoken=async(user_id) => {
    const user= usermodel.findById(user_id)
if(!user){
    console.log("user is not found while generating accesstoken ")
}
const refreshtoken=user.createrefreshtoken()
const accesstoken=user.createaccesstoken()

user.refreshtoken=refreshtoken
await user.save({validateBeforeSave:false})

return{accesstoken,refreshtoken}

}


export const registeruser = async (req, res) => {
    try {
        const { profilename, fullname, email, password, phoneno } = req.body

        if (!profilename || !phoneno || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        const existinguser = await usermodel.findOne(
            { $or: [{ email: email }, { profilename: profilename }] }
        )

        if (existinguser) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        let avatarlocalpath = req.file?.path;

        if (!avatarlocalpath) {
            avatarlocalpath = null
        }
        console.log("avatarlocalpath", avatarlocalpath)
       





        const user = ({ profilename, fullname: fullname?.trim(), email, password, avatar: avatarlocalpath || null, phoneno })
        await redis.set(
            `user:${email}`,
            JSON.stringify(user),
            "EX",
            300
        );
  const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    await redis.set(
        `otp:${email}`,
        otp,
        "EX",
        300
    );
    await sendOTPEmail(email, otp)

        // const user = await usermodel.create({profilename,fullname:fullname?.trim(),email,password,avatar:cloudinaryresult?.url||null,phoneno})
        // console.log("user",user)
        //  if (fs.existsSync(avatarlocalpath)) {
        //     fs.unlinkSync(avatarlocalpath);
        // }
        return res.status(200).json({ success: true, message: "otp send successfully", otp })


    }
    catch (err) {

        console.log(err)
        return res.status(500).json({ success: false, message: "Internal server error" })

    }
}


export const verifyuser = async (req, res) => {


try {

    const useremail = req.body.email
const recivedotp =req.body.otp
if (!useremail||!recivedotp) {
    return res.status(400).json({ success: false, message: "Email and otp  is required" })
}
const storedotp = await redis.get(`otp:${useremail}`);
if(!storedotp){
    return res.status(400).json({ success: false, message: "session expired re register yourself" })
}

if (storedotp !== String(recivedotp)) {
    return res.status(400).json({
        success:false,
        message:"Invalid OTP"
    });
}
    const user = await redis.get(`user:${useremail}`);

    if (!user) {
        return res.status(400).json({ success: false, message: "User not found" })
    }
    console.log ("otp verification is successfull")
const userdata=JSON.parse(user)

 let resizedavatarpath = await resize(userdata.avatar)
        console.log("resizedavatarpath", resizedavatarpath)
        if (!resizedavatarpath) {
            return res.status(500).json({ success: false, message: "Error resizing file" })
        }
  fs.unlinkSync(userdata.avatar);
            const cloudinaryresult = await uploadtocloudinar(resizedavatarpath)
            console.log("cloudinaryresult", cloudinaryresult)
            if (!cloudinaryresult) {
                return res.status(500).json({ success: false, message: "Error uploading file to cloudinary" })
            }

            userdata.avatar = cloudinaryresult.url

            const usersave = await usermodel.create(userdata)
            console.log("user", usersave)
            await redis.del(`user:${useremail}`);
            await redis.del(`otp:${useremail}`);
            return res.status(200).json({ success: true, message: "User registered successfully", usersave })
        

}
catch (err) {

    console.log(err)
    return res.status(500).json({ success: false, message: "Internal server error" })
}}

export const loginuser = async (req, res) => {

const {email,password}=req.body
if(!email||!password){
    return res.status(400).json({success:false,message:"All fields are required"})
}
const user=await usermodel.findOne({email})
if(!user){
    return res.status(400).json({success:false,message:"User not found"})
}
const ispasswordcorrect=await user.ispasswordcorrect(password)
if(!ispasswordcorrect){
    return res.status(400).json({success:false,message:"Invalid password"})
}

const {accesstoken,refreshtoken}=await generateaccessandrefreshtoken(user._id)
const options={
HTMLOnly: true,
secure: true,
sameSite: "none",
}

return res.status(200).cookie("accesstoken",accesstoken,options).cookie("refreshtoken",refreshtoken,options).json({success:true,message:"User logged in successfully",user})


}


