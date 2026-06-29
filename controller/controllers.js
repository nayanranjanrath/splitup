
import mongoose from "mongoose";
import { uploadtocloudinar } from "../utility/cloudinary.js"
import resize from "../utility/sharp.js";
import usermodel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import redis from "../utility/redisconnection.js";
import { sendOTPEmail } from "../utility/nodemailer.js";
// import { secureHeapUsed } from "crypto";
// import { Http2ServerResponse } from "http2";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";


const generateaccessandrefreshtoken = async (user_id) => {
    const user = await usermodel.findById(user_id)
    if (!user) {
        console.log("user is not found while generating accesstoken ")
    }
    const refreshtoken = user.createrefreshtoken()
    const accesstoken = user.createaccesstoken()

    user.refreshtoken = refreshtoken
    await user.save({ validateBeforeSave: false })

    return { accesstoken, refreshtoken }

}

const extractuserid = (incomingaccessToken) => {

    if (!incomingaccessToken) {
        throw new Error("Unauthorized");
    }
    const decodeddata = jwt.verify(
        incomingaccessToken,
        process.env.ACCESSTOKEN_SECRET
    );
    return decodeddata
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
        const recivedotp = req.body.otp
        if (!useremail || !recivedotp) {
            return res.status(400).json({ success: false, message: "Email and otp  is required" })
        }
        const storedotp = await redis.get(`otp:${useremail}`);
        if (!storedotp) {
            return res.status(400).json({ success: false, message: "session expired re register yourself" })
        }

        if (storedotp !== String(recivedotp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }
        const user = await redis.get(`user:${useremail}`);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }
        console.log("otp verification is successfull")
        const userdata = JSON.parse(user)

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
    }
}

export const loginuser = async (req, res) => {

    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" })
    }
    const user = await usermodel.findOne({ email })
    if (!user) {
        return res.status(400).json({ success: false, message: "User not found" })
    }
    const ispasswordcorrect = await user.ispasswordcorrect(password)
    if (!ispasswordcorrect) {
        return res.status(400).json({ success: false, message: "Invalid password" })
    }

    const { accesstoken, refreshtoken } = await generateaccessandrefreshtoken(user._id)
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }

    return res.status(200).cookie("accesstoken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json({ success: true, message: "User logged in successfully", user })


}

export const revalidateuser = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshtoken
        if (!incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const decodeddata = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESHTOKEN_SECRET
        );
        const user = await usermodel.findById(decodeddata._id)
        if (
            incomingRefreshToken !==
            user.refreshtoken
        ) {
            return res.status(401).json({
                success: false,
                message: "Refresh token mismatch"
            });
        }

        const { accesstoken,
            refreshtoken } = await generateaccessandrefreshtoken(user._id)
        const options = {
            HttpOnly: true,
            secure: true,
            sameSite: "none",
        }


        return res.status(200).cookie("accesstoken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json({ success: true, message: "User revalidated successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}


export const logoutuser = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshtoken
        if (!incomingRefreshToken) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const decodeddata = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESHTOKEN_SECRET
        );
        const user = await usermodel.findById(decodeddata._id)
        if (
            incomingRefreshToken !==
            user.refreshtoken
        ) {
            return res.status(401).json({
                success: false,
                message: "Refresh token mismatch operation cant be done "
            });
        }
        user.refreshtoken = undefined
        await user.save({ validateBeforeSave: false })

        return res.status(200).clearCookie("accesstoken").clearCookie("refreshtoken").json({ success: true, message: "User logged out successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }


}
export const platformsplitrequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token)
        console.log("userid", userid)

        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { planname, planprice, planvalidityday, totalslots } = req.body

        if (!planprice || !planvalidityday || !totalslots) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        const localImagePaths = req.files?.map(file => file.path) || [];

        if (localImagePaths.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one proof image."
            });
        }

        const imageUrls = [];

        for (const imagePath of localImagePaths) {
            const result = await uploadtocloudinar(imagePath);
            imageUrls.push(result.secure_url);
        }
        const platformsplitrequest = new platformsharerequestmodel({
            planname,
            planprice,
            planvalidityday,
            requister,
            proofimage: imageUrls,
            totalslots
        });
        const savedrequest = await platformsplitrequest.save();
        return res.status(200).json({ success: true, message: "Request submitted successfully", savedrequest });



    } catch (error) {
        console.log(error);
        console.log(error.message);
        console.log(error.response);
        console.log(error.http_code);
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

