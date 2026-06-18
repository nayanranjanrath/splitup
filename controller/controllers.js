import express from "express"
import mongoose from "mongoose";
import {uploadtocloudinar} from "../utility/cloudinary.js"
import resize   from "../utility/sharp.js";
import usermodel from "../models/user.model.js";

export const registeruser=async(req,res)=>{
    try{
        const {profilename,fullname,email,password,phoneno}=req.body

        if(!profilename || !phoneno || !email || !password){
            return res.status(400).json({success:false,message:"All fields are required"})
        }
        const existinguser = await usermodel.findOne(
           { $or:[{email:email},{profilename:profilename}]}
        )

        if(existinguser){
            return res.status(400).json({success:false,message:"User already exists"})
        }

        const avatarlocalpath = req.files?.avatar[0]?.path;

        if(!avatarlocalpath){
            avatarlocalpath=null
        }
        console.log("avatarlocalpath",avatarlocalpath)
        const resizedavatarpath = await resize(avatarlocalpath)
        console.log("resizedavatarpath",resizedavatarpath)
        if(!resizedavatarpath){
            return res.status(500).json({success:false,message:"Error resizing file"})
        }

        const cloudinaryresult = await uploadtocloudinar(resizedavatarpath)
        console.log("cloudinaryresult",cloudinaryresult)
        if(!cloudinaryresult){
            return res.status(500).json({success:false,message:"Error uploading file to cloudinary"})
        }

        const user = await usermodel.create({profilename,fullname:fullname?.trim()||null,email,password,avatar:cloudinaryresult?.url||null,phoneno})
        console.log("user",user)
        return res.status(200).json({success:true,message:"User created successfully",user})


    }
catch(err){
    return res.status(500).json({success:false,message:"Internal server error"})
    console.log(err)
}
}