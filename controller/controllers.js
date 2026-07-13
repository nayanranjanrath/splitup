
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
import aplicantmodel from "../models/aplicant.model.js";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import categorymodle from "../models/category.model.js";
import ratingmodel from "../models/rating.model.js";


import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { report } from "process";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);




export const generateaccessandrefreshtoken = async (user_id) => {
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

export const extractuserid = (incomingaccessToken) => {

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
        const requestid = req.body.requestid
        const request = await platformsharerequestmodel.findById(requestid)
        if (!request) {
            return res.status(400).json({ success: false, message: "Request not found" })
        }
        const platform = request.platformname
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
        //------------image check with ai stats from here --------
        const imageToVerify = localImagePaths[0];
        const imageBuffer = fs.readFileSync(imageToVerify);

        // Determine mime type based on file extension
        const extension = path.extname(imageToVerify).toLowerCase();
        const mimeType = extension === '.png' ? 'image/png' :
            (extension === '.webp' ? 'image/webp' : 'image/jpeg');

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: mimeType
            }
        };

        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const verificationSchema = {
            type: SchemaType.OBJECT,
            properties: {
                is_platform: {
                    type: SchemaType.BOOLEAN,
                    description: `Does this image clearly show authentic UI for ${platform}?`
                },
                is_ai_generated: {
                    type: SchemaType.BOOLEAN,
                    description: "Are there obvious AI artifacts, warped text, or fake elements?"
                },
                has_premium_proof: {
                    type: SchemaType.BOOLEAN,
                    description: "Does the image contain visual proof of a paid account, premium subscription, paid game library, or a transaction history? (e.g., a 'Premium' badge, games that cost money, or an active subscription page)."
                },
                premium_evidence: {
                    type: SchemaType.STRING,
                    description: "List the specific text or UI elements in the image that prove this is a paid/premium account (e.g., 'Elden Ring in library', 'Next billing date: Aug 12', or 'Steam Level 15'). If none, say 'None'."
                },
                reasoning: {
                    type: SchemaType.STRING,
                    description: "Briefly explain the final decision to pass or fail this image."
                }
            },
            required: ["is_platform", "is_ai_generated", "has_premium_proof", "premium_evidence", "reasoning"],
        };
        const prompt = `You are a strict fraud-prevention moderator verifying account screenshots for a platform-sharing service. 
    The user claims this screenshot proves they have an active, paid account for the platform: "${platform}".

    Analyze the image and determine if it meets our security criteria:
    1. It must be a genuine screenshot of ${platform}.
    2. It must show proof of the HIGHEST or STANDARD premium tier. Free, budget, or "Lite" accounts are instantly rejected.
    
    CRITICAL TIER RULES:
    - Many platforms offer budget tiers that do not include full shareable benefits. These MUST BE REJECTED.
    - For Software (ChatGPT/OpenAI): Reject "Go". Accept "Plus" or "Pro".
    - For Xbox Game Pass: Reject "Essential" or "Core". Accept "Premium" or "Ultimate".
    - For YouTube: Reject "Premium Lite". Accept standard "Premium".
    - Catch-All Rule: For ANY other platform, if the screenshot displays keywords like "Lite", "Basic", "Essential", "Starter", or "Go", you must reject it.
    
    Examples of valid proof:
    - An account details page clearly stating the full premium subscription name.
    - For gaming: Paid games in the library or a high account level.
    
    Look closely at the text, UI layout, and badges. Do not assume it is a paid, full-tier account unless you see direct evidence.`;

        // Force Gemini to return clean JSON so it never breaks your code
        const aiResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: verificationSchema // <-- THIS IS THE MISSING LINE!
            }
        });
        // 1. Get the raw text from the response
        // ... inside your try block, after generating content ...
        const rawText = aiResult.response.text();
        const verificationData = JSON.parse(rawText);

        console.log("Moderation Result:", verificationData);

        // Block if it's the wrong platform, AI generated, OR lacks premium proof
        if (!verificationData.is_platform || verificationData.is_ai_generated || !verificationData.has_premium_proof) {
            for (const file of localImagePaths) {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }
            // You can use the AI's reasoning to give the user a helpful error message!
            return res.status(400).json({
                success: false,
                message: `Verification failed: ${verificationData.reasoning} Please ensure your screenshot clearly shows your active subscription, paid library, or premium badges.`
            });
        }

        // -----------image check with ai ends  here --------

        const imageUrls = await Promise.all(
            localImagePaths.map(async (imagePath) => {
                const { outputPath } = await convertToJpg(imagePath);

                const result = await uploadtocloudinar(outputPath);

                return {
                    url: result.secure_url,
                    publicId: result.public_id
                };
            })
        );





        request.planname = planname,
            request.planprice = planprice,
            request.planvalidityday = planvalidityday,
            request.requister = userid._id,
            request.proofimage = imageUrls,
            request.totalslots = totalslots



        const savedrequest = await request.save();


        return res.status(200).json({ success: true, message: "Request submitted successfully", savedrequest });



    } catch (error) {
        console.log(error);


        return res.status(500).json({ success: false, message: "internalserver error" })
    }
}

export const selectplatform = async (req, res) => {
    try {
        // const requestid = req.body.requestid
        const platformid = req.body.platformid
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token)
        console.log("userid", userid)

        const user = await usermodel.findById(userid._id);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        // const request = await platformsharerequestmodel.findById(requestid)
        // if (!request) {
        //     return res.status(400).json({ success: false, message: "Request not found" })
        // }
        // if (!request.requister.equals(user._id)) {
        //     console.log("cant edit others platform you know ")
        //     return res.status(401).json({ success: false, message: "Unauthorized" })
        // }
        const platformdetails = await platformmodel.findById(platformid)
        if (!platformdetails) {
            console.log("platform not found")
            return res.status(400).json({ success: false, message: "Platform not found please add one " })
        }

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );
        const newrequest = new platformsharerequestmodel({

            requister: userid._id,
            platformname: platformid,
            expiresAt: expiresAt
        })
        await newrequest.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "request added successfully", newrequest });
        // request.platformname = platformid
        // await request.save()
        // return res.status(200).json({
        //     success: true,
        //     message: "Platform added successfully",
        //     request
        // });
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
        res.set("Cache-Control", "public, max-age=300");
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
        const { categoryid, minprice, maxprice, minmember, maxmember, searchtext, planvalidityday, slots } = req.query;
        if (!categoryid && !minprice && !maxprice && !minmember && !maxmember && !searchtext && !planvalidityday && !slots) {
            return res.status(400).json({ success: false, message: "At least one filter is required" });
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;
        const pipeline = [];
        pipeline.push(
            {
                $lookup: {
                    from: "platforms",
                    localField: "platformname",
                    foreignField: "_id",
                    as: "platform"
                }
            },
            {
                $unwind: "$platform"
            },
            {
                $lookup: {
                    from: "usermodels",
                    localField: "requister",
                    foreignField: "_id",
                    as: "requister"
                }
            },
            {
                $unwind: "$requister"
            }
        );
        if (searchtext) {
            pipeline.push(

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

        pipeline.push({
            $sort: {
                createdAt: -1
            }
        });
        pipeline.push({
            $skip: skip
        });

        pipeline.push({
            $limit: limit
        });
        pipeline.push({
            $project: {
                "platform.platformdescription": 0,
                "platform.createdAt": 0,
                "platform.__v": 0,
                "requister.email": 0,
                "requister.password": 0,
                "requister.phoneno": 0,
                "requister.createdAt": 0,
                "requister.__v": 0,
                "requister.refreshtoken": 0,
                "requister.upiid": 0,
                "requister.fullname": 0
            }
        });

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

export const applyforrequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid } = req.body;
        const request = await platformsharerequestmodel.findById(requestid);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (request.members.some(member =>
            member.equals(userid._id))) {
            return res.status(400).json({ success: false, message: "You have already accepted for this request" });
        }
        const requestaplicant = await aplicantmodel.findOne({ request: requestid, platformname: request.platformname });
        if (!requestaplicant) {
            const newaplicant = new aplicantmodel({
                request: requestid,
                platformname: request.platformname,
                applicant: [userid._id]
            });
            await newaplicant.save();
            return res.status(200).json({ success: true, message: "Applied for request successfully" });
        }
        const existingaplicant = requestaplicant.applicant.some(aplicant => aplicant.equals(userid._id));
        if (existingaplicant) {
            return res.status(400).json({ success: false, message: "You have already applied for this request" });

        }
        requestaplicant.applicant.push(userid._id);
        await requestaplicant.save();
        return res.status(200).json({ success: true, message: "Applied for request successfully" });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }

}

export const showapplicants = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        res.set("Cache-Control", "public, max-age=600");
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid } = req.params;
        const aplicatnt = await aplicantmodel.findOne({ request: requestid }).populate("applicant", "profilename avatar reting").select("-__v -request -platformname -status -createdAt");
        if (!aplicatnt) {
            return res.status(404).json({ success: false, message: "No applicants found for this request" });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "Applicants found", aplicatnt });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const acceptapplicant = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid, aplicantid } = req.body;
        const request = await platformsharerequestmodel.findById(requestid);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        if (request.requister.toString() !== userid._id.toString()) {
            return res.status(402).json({ success: false, message: "Unauthorized only requester can accept applicant" });
        }
        const aplicant = await aplicantmodel.findOne({ request: requestid, applicant: { $in: aplicantid } });
        if (!aplicant) {
            return res.status(404).json({ success: false, message: "Applicant not found" });
        }
        console.log("members here", request.members.length + 1);
        if (request.members.length + 1 >= request.totalslots) {
            return res.status(400).json({ success: false, message: "Request has already reached maximum number of members" });
        }
        if (request.members.some(member => member.equals(aplicantid))) {
            return res.status(400).json({ success: false, message: "Applicant is already a member of this request" });
        }
        request.members.push(aplicantid);
        if (request.members.length + 1 === request.totalslots) {
            request.status = "full"
        }
        await request.save();
        return res.status(200).json({ success: true, message: "Applicant accepted successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
export const showrequeststatus = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        res.set("Cache-Control", "public, max-age=3600");
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid } = req.params;
        const request = await platformsharerequestmodel.findById(requestid).select("-__v   -createdAt  -requister -proofimage -planvalidityday").populate("members", "profilename ");
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (request.requister.toString() === userid._id.toString()) {

            return res.status(200).json({ success: true, message: "You are the requester of this request", status: "requester" });
        }

        if (request.members.some(member => member.equals(userid._id))) {

            return res.status(200).json({ success: true, message: "You are a member of this request", status: "accepted" });
        }
        return res.status(200).json({ success: true, message: "You are not a member of this request", status: "pending" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const removeapplicant = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid, aplicantid } = req.body;
        const request = await platformsharerequestmodel.findById(requestid);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        if (request.requister.toString() !== userid._id.toString()) {
            return res.status(402).json({ success: false, message: "Unauthorized only requester can remove applicant" });
        }
        const aplicant = await aplicantmodel.findOne({ request: requestid, applicant: { $in: aplicantid } });
        if (!aplicant) {
            return res.status(404).json({ success: false, message: "Applicant not found" });
        }
        request.members = request.members.filter(member => !member.equals(aplicantid));
        await request.save();
        return res.status(200).json({ success: true, message: "Applicant removed successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const deleterequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { requestid } = req.body;
        const request = await platformsharerequestmodel.findById(requestid);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        if (request.requister.toString() !== userid._id.toString()) {
            return res.status(402).json({ success: false, message: "Unauthorized only requester can remove request" });
        }
        const deletedrequest = await request.deleteOne();
        if (!deletedrequest) {
            return res.status(404).json({ success: false, message: "Request not found to delete" });
        }

        return res.status(200).json({ success: true, message: "Request deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const myrequest = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const requests = await platformsharerequestmodel.find({ requister: userid._id }).select("-__v   -createdAt  -requister -proofimage -planvalidityday").populate("members", "profilename ");
        if (!requests) {
            return res.status(404).json({ success: false, message: "No requests found" });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "Requests found", requests });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const myapply = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const requests = await aplicantmodel
            .find({
                applicant: userid._id
            })
            .populate({
                path: "request",
                select: "-proofimage -planvalidityday -__v",
                populate: [
                    {
                        path: "requister",
                        select: "profilename avatar"
                    },
                    {
                        path: "platformname",
                        select: "platformname"
                    },
                    {
                        path: "members",
                        select: "profilename"
                    }
                ]
            })
            .select("-__v -createdAt");
        if (!requests) {
            return res.status(404).json({ success: false, message: "No requests found" });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "Requests found", requests });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}