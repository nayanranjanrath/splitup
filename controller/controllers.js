
import mongoose from "mongoose";
import { uploadtocloudinar } from "../utility/cloudinary.js"
import { resize, convertToJpg } from "../utility/sharp.js";
import usermodel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import redis from "../utility/redisconnection.js";
import path from 'path';
import { sendOTPEmail } from "../utility/nodemailer.js";
import platformmodel from "../models/platform.model.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import categorymodle from "../models/category.model.js";
import ratingmodel from "../models/rating.model.js";


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
        if (userdata.avatar !== null) {


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
        }
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
        secure: false,
        sameSite: "none",
        maxAge: 10 * 24 * 60 * 60 * 1000,
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
            maxAge: 10 * 24 * 60 * 60 * 1000,
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

        // const user = await usermodel.findById(userid._id);
        // if (!user) {
        //     return res.status(401).json({ success: false, message: "Unauthorized" });
        // }
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

        const imageUrls = await Promise.all(
            localImagePaths.map(async (imagePath) => {
                const { outputPath } = await convertToJpg(imagePath);

                const result = await uploadtocloudinar(outputPath);

                return result.secure_url;
            })
        );
        // const imageUrls = [];

        // // 
        // //         }
        // const jpgpathone = await convertToJpg(localImagePaths[0]);
        // const jpgpathtwo = await convertToJpg(localImagePaths[1]);


        // const [resultone, resulttwo] = await Promise.all([
        //     uploadtocloudinar(jpgpathone.outputPath),
        //     uploadtocloudinar(jpgpathtwo.outputPath)
        // ]);
        // imageUrls.push(resultone.secure_url);
        // imageUrls.push(resulttwo.secure_url);




        const platformsplitrequest = new platformsharerequestmodel({
            planname,
            planprice,
            planvalidityday,
            requister: userid._id,
            proofimage: imageUrls,
            totalslots
        });
        const savedrequest = await platformsplitrequest.save();
        return res.status(200).json({ success: true, message: "Request submitted successfully", savedrequest });



    } catch (error) {
        console.log(error);

        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const selectplatform = async (req, res) => {
    try {
        const requestid = req.body.requestid
        const platformid = req.body.platformid
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token)
        console.log("userid", userid)

        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const request = await platformsharerequestmodel.findById(requestid)
        if (!request) {
            return res.status(400).json({ success: false, message: "Request not found" })
        }
        if (!request.requister.equals(user._id)) {
            console.log("cant edit others platform you know ")
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const platformdetails = await platformmodel.findById(platformid)
        if (!platformdetails) {
            console.log("platform not found")
            return res.status(400).json({ success: false, message: "Platform not found please add one " })
        }

        request.platformname = platformid
        await request.save()
        return res.status(200).json({
            success: true,
            message: "Platform added successfully",
            request
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({ success: false, message: "internalserver error" })
    }


}

export const createplatform = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token)
        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { platformname, platformdescription } = req.body
        if (!platformname) {
            return res.status(400).json({ success: false, message: "platformname is required" })
        }
        const platform = new platformmodel({
            platformname,
            platformdescription,

        })
        const savedplatform = await platform.save();
        await redis.del("allplatform");
        return res.status(200).json({ success: true, message: "Platform created successfully", savedplatform });
    } catch (error) {
        console.log(error);

        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const selectcategory = async (req, res) => {
    try {
        const incomingcategory = req.body.categoryid
        const platformid = req.body.platformid
        const platform = await platformmodel.findById(platformid)
        if (!platform) {
            return res.status(400).json({ success: false, message: "Platform not found" })
        }
        const category = await categorymodle.findById(incomingcategory)
        if (!category) {

            return res.status(400).json({ success: false, message: "Platform not found" })
        }
        category.platform.push(platform);
        await category.save();

        return res.status(200).json({ success: true, message: "Tags updated successfully" })
    } catch (error) {
        console.log(error);

        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const createcategory = async (req, res) => {
    try {
        const categoryname = req.body.categoryname
        const platformid = req.body.platformid
        const platform = await platformmodel.findById(platformid)
        if (!platform) {
            return res.status(400).json({ success: false, message: "Platform not found" })
        }
        const category = new categorymodle({
            categoryname: categoryname,
            platform: [platform]
        });
        const savedcategory = await category.save();
        await redis.del("allcategory");
        return res.status(200).json({ success: true, message: "Category created successfully", savedcategory });
    } catch (error) {
        console.log(error);

        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showallplatform = async (req, res) => {
    try {
        const data = await redis.get("allplatform");
        if (data) {
            return res.status(200).json({ success: true, message: "All platform", allplatform: JSON.parse(data) });
        }

        const allplatform = await platformmodel.find().select("-platformdescription -createdAt -__v").lean();
        await redis.set("allplatform", JSON.stringify(allplatform), "EX", 3600);
        return res.status(200).json({ success: true, message: "All platform", allplatform });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showallcategory = async (req, res) => {
    try {
        const data = await redis.get("allcategory");
        if (data) {
            return res.status(200).json({ success: true, message: "All category", allcategory: JSON.parse(data) });
        }

        const allcategory = await categorymodle.find().select("-createdAt -__v -platform").lean();
        await redis.set("allcategory", JSON.stringify(allcategory), "EX", 3600);
        return res.status(200).json({ success: true, message: "All category", allcategory });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const detailsofplatform = async (req, res) => {
    try {
        const platformid = req.params.platformid
        res.set("Cache-Control", "public, max-age=3600");
        const platform = await platformmodel.findById(platformid)
        if (!platform) {
            return res.status(400).json({ success: false, message: "Platform not found" })
        }

        return res.status(200).json({ success: true, message: "Platform details", platform });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const showprofile = async (req, res) => {
    try {
        const userid = new mongoose.Types.ObjectId(req.params.userid);
        if (!userid) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        const user = await usermodel.aggregate([
            { $match: { _id: userid } },
            {
                $lookup: {
                    from: "ratingmodels",
                    localField: "_id",
                    foreignField: "user",
                    as: "ownrating"
                }
            },

            {
                $addFields: {
                    averageRating: { $avg: "$ownrating.rating" },

                    totalRatings: { $size: "$ownrating" },

                    memberSinceDays: {
                        $dateDiff: {
                            startDate: "$createdAt",
                            endDate: "$$NOW",
                            unit: "day"
                        }
                    }

                }
            },
            {
                $project: {

                    email: 0,
                    password: 0,
                    refreshtoken: 0,
                    phoneno: 0,
                    __v: 0,
                    createdAt: 0,
                    ownrating: 0
                }
            }
        ])

        if (!user || user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.set("Cache-Control", "public, max-age=3600");
        return res.status(200).json({ success: true, message: "User profile", user: user[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const rateuser = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const { rateduserid, rating, review } = req.body;
        if (!rateduserid || !rating) {
            return res.status(400).json({ success: false, message: "Rated user ID and rating are required" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const rateduser = await usermodel.findById(rateduserid);
        if (!rateduser) {
            return res.status(404).json({ success: false, message: "Rated user not found" });
        }
        const existingrating = await ratingmodel.findOne({ user: rateduserid, rater: userid._id });
        if (existingrating) {
            // existingrating.rating = rating;
            // existingrating.review = review 
            // await existingrating.save();
            return res.status(200).json({ success: true, message: "you alredy rated this user", existingrating });
        }
        const newrating = new ratingmodel({ user: rateduserid, rater: userid._id, rating, review });
        await newrating.save();
        return res.status(200).json({ success: true, message: "Rating added successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "internalserver error" })

    }
}


export const showreviews = async (req, res) => {
    try {
        const { userid } = req.params;
        if (!userid) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
        const reviews = await ratingmodel.find({ user: userid }).select("-__v -user").populate("rater", "profilename avatar");
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ success: false, message: "No reviews found for this user" });
        }
        return res.status(200).json({ success: true, message: "User reviews", reviews });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const editrating = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const { rateduserid, rating, review } = req.body;
        if (!rateduserid || !rating) {
            return res.status(400).json({ success: false, message: "Rated user ID and rating are required" });
        }
        const userid = extractuserid(token)
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const rateduser = await usermodel.findById(rateduserid);
        if (!rateduser) {
            return res.status(404).json({ success: false, message: "Rated user not found" });
        }
        const existingrating = await ratingmodel.findOne({ user: rateduserid, rater: userid._id });
        if (!existingrating) {
            return res.status(404).json({ success: false, message: "Rating not found" });
        }
        existingrating.rating = rating;
        existingrating.review = review
        await existingrating.save();
        return res.status(200).json({ success: true, message: "Rating updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const showrequest = async (req, res) => {
    //use req.query  for all the fields like category minprise maxprise maxmember minmember etc and the searchtext which is the text by user 
    //use the aggregate function to match searchtext either with platform or user 
    //add a field called perpersoncost to the request which will be used to search the min and max price 
    try {
        const { categoryid, minprice, maxprice, minmember, maxmember, searchtext, planvalidityday,slots } = req.query;
        if(!categoryid&& !minprice && !maxprice && !minmember && !maxmember && !searchtext && !planvalidityday && !slots) {
            return res.status(400).json({ success: false, message: "At least one filter is required" });
        }
        const pipeline = [];
        if (searchtext) {
            pipeline.push(
                {
                    $lookup: {
                        from: "platforms",
                        localField: "platformname",
                        foreignField: "_id",
                        as: "platform"
                    }

                },
                //  { $unwind: "$platform"},
                {
                    $lookup: {
                        from: "usermodels",
                        localField: "requister",
                        foreignField: "_id",
                        as: "requister"
                    }
                },
                { $unwind: "$requister" },
                {

                    $match: {
                        $or: [
                            {
                                "platform.platformname": {
                                    $regex: searchtext,
                                    $options: "i"
                                }
                            },
                            {
                                "requister.profilename": {
                                    $regex: searchtext,
                                    $options: "i"
                                }
                            }

                        ]
                    }
                })

        }
        if (categoryid) {
            const category = await categorymodle.findById(categoryid).select("-__v -createdAt");


            pipeline.push({
                $match: {
                    platformname: {
                        $in: category.platform
                    }
                }
            })
        }
        if (minprice) {
            pipeline.push({
                $match: {
                    $expr: {
                        $gte: [{ $divide: ["$planprice", "$totalslots"] }, parseFloat(minprice)]
                    }
                }
            })
        }
        if (maxprice) {
            pipeline.push({
                $match: {
                    $expr: {
                        $lte: [{ $divide: ["$planprice", "$totalslots"] }, parseFloat(maxprice)]
                    }
                }
            })
        }
        if (minmember) {
            pipeline.push(
                {
                    $match: {
                        $expr: {
                            $gte: [
                                {
                                    $size: "$members"
                                },
                                Number(minmember)
                            ]
                        }
                    }
                }
            )
        }
        if (maxmember) {
            pipeline.push({
                $match: {
                    $expr: {
                        $lte: [
                            {
                                $size: "$members"
                            },
                            Number(maxmember)
                        ]
                    }
                }
            })
        }
        if (planvalidityday) {
            pipeline.push({
                $match: {
                    planvalidityday: { $gte: parseFloat(planvalidityday) }
                }
            })
        }
        if (slots) {
            pipeline.push({
                $match: {
                    totalslots: { $gte: parseFloat(slots) }
                }
            })
        }
       
        const requests = await platformsharerequestmodel.aggregate(pipeline);
        if (requests.length === 0) {
            return res.status(404).json({ success: false, message: "No requests found" });
        }
        else {
            res.set("Cache-Control", "public, max-age=300");
            return res.status(200).json({ success: true, message: "Requests found", requests });
        }




    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}