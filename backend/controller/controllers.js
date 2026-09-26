
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
import tempChatModel from "../models/tempchat.model.js";
import notificationmodel from "../models/notification.model.js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import savedrequestmodel from "../models/savedrequest.model.js";
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
        return null;
    }

    try {

        const decodeddata = jwt.verify(
            incomingaccessToken,
            process.env.ACCESSTOKEN_SECRET
        );

        return decodeddata;

    } catch (error) {

        // Send the actual JWT error back to middleware
        throw error;
    }
};
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
    console.log("loginuser called")
    try {


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
            console.log("invalid password")
            return res.status(400).json({ success: false, message: "Invalid password" })
        }

        const { accesstoken, refreshtoken } = await generateaccessandrefreshtoken(user._id)
        const isProduction = process.env.NODE_ENV === "production";

        const options = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000,
            path: "/",
        };
        const notification = await notificationmodel.create({ user: user._id, message: "wellcome to splitup" })
        return res.status(200).cookie("accesstoken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json({ success: true, message: "User logged in successfully", user })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }

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
        const isProduction = process.env.NODE_ENV === "production";

        const options = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000,
            path: "/",
        };

        return res.status(200).cookie("accesstoken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json({ success: true, message: "User revalidated successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}
export const getuseravatar = async (req, res) => {
    try {
        const userid = req.userId;

        if (!userid) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const user = await usermodel.findById(userid).select("avatar profilename");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "User avatar found",
            user
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
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

        const isProduction = process.env.NODE_ENV === "production";

        const clearOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
        };

        return res
            .status(200)
            .clearCookie("accesstoken", clearOptions)
            .clearCookie("refreshtoken", clearOptions)
            .json({
                success: true,
                message: "User logged out successfully"
            });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "internalserver error" })
    }


}
export const platformsplitrequest = async (req, res) => {
    try {

        const userid = req.userId;

        const requestid = req.body.requestid;

        const request = await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(400).json({
                success: false,
                message: "Request not found"
            });
        }

        const platform = request.platformname;

        const {
            planname,
            planprice,
            planvalidityday,
            totalslots
        } = req.body;

        if (!planprice || !planvalidityday || !totalslots) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // --------------------------------------------------
        // GET UPLOADED IMAGES
        // --------------------------------------------------

        const localImagePaths = req.files?.map(file => file.path) || [];

        if (localImagePaths.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one proof image."
            });
        }

        // --------------------------------------------------
        // AI VERIFICATION
        // --------------------------------------------------

        let aiVerified = false;
        let aiVerificationSkipped = false;
        let verificationData = null;

        try {

            const imageToVerify = localImagePaths[0];

            const imageBuffer = fs.readFileSync(imageToVerify);

            const extension = path.extname(imageToVerify).toLowerCase();

            const mimeType =
                extension === ".png"
                    ? "image/png"
                    : extension === ".webp"
                        ? "image/webp"
                        : "image/jpeg";

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: mimeType
                }
            };

            const model = genAI.getGenerativeModel({
                model: "gemini-3.5-flash"
            });

            const verificationSchema = {
                type: SchemaType.OBJECT,

                properties: {

                    is_platform: {
                        type: SchemaType.BOOLEAN,
                        description:
                            `Does this image clearly show authentic UI for ${platform}?`
                    },

                    is_ai_generated: {
                        type: SchemaType.BOOLEAN,
                        description:
                            "Are there obvious AI artifacts, warped text, or fake elements?"
                    },

                    has_premium_proof: {
                        type: SchemaType.BOOLEAN,
                        description:
                            "Does the image contain visual proof of a paid account, premium subscription, paid game library, or a transaction history? (e.g., a 'Premium' badge, games that cost money, or an active subscription page)."
                    },

                    premium_evidence: {
                        type: SchemaType.STRING,
                        description:
                            "List the specific text or UI elements in the image that prove this is a paid/premium account. If none, say 'None'."
                    },

                    reasoning: {
                        type: SchemaType.STRING,
                        description:
                            "Briefly explain the final decision to pass or fail this image."
                    }

                },

                required: [
                    "is_platform",
                    "is_ai_generated",
                    "has_premium_proof",
                    "premium_evidence",
                    "reasoning"
                ]
            };

            const prompt = `
You are a strict fraud-prevention moderator verifying account screenshots for a platform-sharing service.

The user claims this screenshot proves they have an active, paid account for the platform: "${platform}".

Analyze the image and determine if it meets our security criteria:

1. It must be a genuine screenshot of ${platform}.

2. It must show proof of the HIGHEST or STANDARD premium tier.
Free, budget, or "Lite" accounts are instantly rejected.

CRITICAL TIER RULES:

- Many platforms offer budget tiers that do not include full shareable benefits. These MUST BE REJECTED.

- For Software (ChatGPT/OpenAI):
  Reject "Go".
  Accept "Plus" or "Pro".

- For Xbox Game Pass:
  Reject "Essential" or "Core".
  Accept "Premium" or "Ultimate".

- For YouTube:
  Reject "Premium Lite".
  Accept standard "Premium".

- Catch-All Rule:
  For ANY other platform, if the screenshot displays keywords like "Lite", "Basic", "Essential", "Starter", or "Go", you must reject it.

Examples of valid proof:

- An account details page clearly stating the full premium subscription name.
- For gaming: Paid games in the library or a high account level.

Look closely at the text, UI layout, and badges.
Do not assume it is a paid, full-tier account unless you see direct evidence.
`;

            const aiResult = await model.generateContent({

                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            },
                            imagePart
                        ]
                    }
                ],

                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: verificationSchema
                }

            });

            const rawText = aiResult.response.text();

            verificationData = JSON.parse(rawText);

            console.log(
                "Moderation Result:",
                verificationData
            );

            // --------------------------------------------------
            // AI VERIFICATION FAILED
            // --------------------------------------------------

            if (
                !verificationData.is_platform ||
                verificationData.is_ai_generated ||
                !verificationData.has_premium_proof
            ) {

                for (const file of localImagePaths) {

                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }

                }

                await notificationmodel.create({
                    user: userid,
                    message:
                        "Your proof image was rejected due to the following reason: " +
                        verificationData.reasoning
                });

                return res.status(400).json({

                    success: false,

                    message:
                        `Verification failed: ${verificationData.reasoning} Please ensure your screenshot clearly shows your active subscription, paid library, or premium badges.`
                });
            }

            // --------------------------------------------------
            // AI VERIFICATION SUCCESS
            // --------------------------------------------------

            aiVerified = true;

            console.log("AI verification successful.");

        } catch (aiError) {

            console.error(
                "Gemini verification error:",
                aiError
            );

            // --------------------------------------------------
            // GEMINI 503 FALLBACK
            // --------------------------------------------------

            if (aiError?.status === 503) {

                console.log(
                    "Gemini is temporarily unavailable (503)."
                );

                console.log(
                    "Skipping AI verification and saving request."
                );

                aiVerified = false;
                aiVerificationSkipped = true;

            } else {

                for (const file of localImagePaths) {

                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }

                }

                return res.status(500).json({

                    success: false,

                    message:
                        "AI verification service is currently unavailable. Please try again later."
                });
            }
        }

        // --------------------------------------------------
        // UPLOAD IMAGES TO CLOUDINARY
        // --------------------------------------------------

        const imageUrls = await Promise.all(

            localImagePaths.map(async (imagePath) => {

                const { outputPath } =
                    await convertToJpg(imagePath);

                const result =
                    await uploadtocloudinar(outputPath);

                return {

                    url: result.secure_url,

                    publicId: result.public_id

                };

            })

        );

        // --------------------------------------------------
        // UPDATE REQUEST
        // --------------------------------------------------

        request.planname = planname;

        request.planprice = planprice;

        request.planvalidityday = planvalidityday;

        request.requister = userid;

        request.proofimage = imageUrls;

        request.totalslots = totalslots;

        // --------------------------------------------------
        // OPTIONAL AI STATUS
        // --------------------------------------------------

        request.aiVerified = aiVerified;

        request.aiVerificationSkipped =
            aiVerificationSkipped;

        // --------------------------------------------------
        // SAVE REQUEST
        // --------------------------------------------------

        const savedrequest = await request.save();

        // --------------------------------------------------
        // SUCCESS NOTIFICATION
        // --------------------------------------------------

        let notificationMessage =
            "You have successfully created a new request";

        if (aiVerificationSkipped) {

            notificationMessage =
                "Your request was created successfully. AI verification was temporarily unavailable, so your proof was saved without AI verification.";

        }

        await notificationmodel.create({

            user: userid,

            message: notificationMessage

        });

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.status(200).json({

            success: true,

            message: aiVerificationSkipped
                ? "Request submitted successfully. AI verification was temporarily unavailable."
                : "Request submitted successfully",

            aiVerified: aiVerified,

            aiVerificationSkipped:
                aiVerificationSkipped,

            savedrequest

        });

    } catch (error) {

        console.error(
            "platformsplitrequest error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Internal server error"

        });

    }
};
export const selectplatform = async (req, res) => {
    try {
        const userid = req.userId;

        // const requestid = req.body.requestid
        const platformid = req.body.platformid

        console.log("userid", userid)

        const user = await usermodel.findById(userid);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
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
            return res.status(400).json({
                success: false,
                message: "Platform not found please add one "
            })
        }

        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );

        const newrequest = new platformsharerequestmodel({

            requister: userid,
            platformname: platformid,
            expiresAt: expiresAt
        })

        await newrequest.save({
            validateBeforeSave: false
        });

        return res.status(200).json({
            success: true,
            message: "request added successfully",
            newrequest
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
}
export const createplatform = async (req, res) => {
    try {
        const userid = req.userId;

        const user = await usermodel.findById(userid);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const {
            platformname,
            platformdescription
        } = req.body

        if (!platformname) {
            return res.status(400).json({
                success: false,
                message: "platformname is required"
            })
        }

        const platform = new platformmodel({
            platformname,
            platformdescription,
        })

        const savedplatform = await platform.save();

        await redis.del("allplatform");

        return res.status(200).json({
            success: true,
            message: "Platform created successfully",
            savedplatform
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
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
        const cursor = req.query.cursor;
        const limit = 10;

        const query = {};

        if (cursor) {
            query._id = { $gt: cursor };
        }

        const allplatform = await platformmodel
            .find(query)
            .select("-platformdescription -createdAt -__v")
            .sort({ _id: 1 })
            .limit(limit)
            .lean();

        const nextCursor =
            allplatform.length > 0
                ? allplatform[allplatform.length - 1]._id
                : null;

        res.set(
            "Cache-Control",
            "private, max-age=360"
        );
        return res.status(200).json({
            success: true,
            message: "All platform",
            allplatform,
            hasMore: allplatform.length === limit,
            nextCursor
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
};
export const showallcategory = async (req, res) => {
    try {
        const cursor = req.query.cursor;
        const limit = 10;

        const query = {};

        if (cursor) {
            query._id = { $gt: cursor };
        }

        const allcategory = await categorymodle
            .find(query)
            .select("-createdAt -__v -platform")
            .sort({ _id: 1 })
            .limit(limit)
            .lean();

        const nextCursor =
            allcategory.length > 0
                ? allcategory[allcategory.length - 1]._id
                : null;
        res.set(
            "Cache-Control",
            "private, max-age=360"
        );
        return res.status(200).json({
            success: true,
            message: "All category",
            allcategory,
            hasMore: allcategory.length === limit,
            nextCursor
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
};
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
        const userid = req.userId;

        const {
            rateduserid,
            rating,
            review
        } = req.body;

        if (!rateduserid || !rating) {
            return res.status(400).json({
                success: false,
                message: "Rated user ID and rating are required"
            });
        }

        const user = await usermodel.findById(userid);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const rateduser = await usermodel.findById(rateduserid);

        if (!rateduser) {
            return res.status(404).json({
                success: false,
                message: "Rated user not found"
            });
        }

        const existingrating = await ratingmodel.findOne({
            user: rateduserid,
            rater: userid
        });

        if (existingrating) {
            return res.status(200).json({
                success: true,
                message: "you alredy rated this user",
                existingrating
            });
        }

        const newrating = new ratingmodel({
            user: rateduserid,
            rater: userid,
            rating,
            review
        });

        await newrating.save();

        return res.status(200).json({
            success: true,
            message: "Rating added successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
};
export const showalredyratedornot = async (req, res) => {
    try {
        const userid = req.userId;

        const { rateduserid } = req.params;

        if (!rateduserid) {
            return res.status(400).json({
                success: false,
                message: "Rated user ID is required"
            });
        }

        if (!mongoose.isValidObjectId(rateduserid)) {
            return res.status(400).json({
                success: false,
                message: "Invalid rated user ID"
            });
        }

        if (userid.toString() === rateduserid.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot rate yourself"
            });
        }

        const rateduser = await usermodel.findById(rateduserid);

        if (!rateduser) {
            return res.status(404).json({
                success: false,
                message: "Rated user not found"
            });
        }

        const existingrating = await ratingmodel.findOne({
            user: rateduserid,
            rater: userid
        });

        if (existingrating) {
            return res.status(200).json({
                success: true,
                canRate: false,
                message: "You already rated this user",
                existingrating
            });
        }

        return res.status(200).json({
            success: true,
            canRate: true,
            message: "You can add rating"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
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
        const userid = req.userId;

        const {
            rateduserid,
            rating,
            review
        } = req.body;

        if (!rateduserid || !rating) {
            return res.status(400).json({
                success: false,
                message: "Rated user ID and rating are required"
            });
        }

        const user = await usermodel.findById(userid);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const rateduser = await usermodel.findById(rateduserid);

        if (!rateduser) {
            return res.status(404).json({
                success: false,
                message: "Rated user not found"
            });
        }

        const existingrating = await ratingmodel.findOne({
            user: rateduserid,
            rater: userid
        });

        if (!existingrating) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        existingrating.rating = rating;
        existingrating.review = review

        await existingrating.save();

        return res.status(200).json({
            success: true,
            message: "Rating updated successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
// search controller ----
export const showrequest = async (req, res) => {
    try {
        const {
            categoryid,
            minprice,
            maxprice,
            minmember,
            maxmember,
            searchtext,
            planvalidityday,
            slots
        } = req.query;



        if (
            !categoryid &&
            !minprice &&
            !maxprice &&
            !minmember &&
            !maxmember &&
            !searchtext &&
            !planvalidityday &&
            !slots
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one filter is required"
            });
        }



        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            50
        );

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



        if (searchtext && searchtext.trim()) {
            const escapedSearchText = searchtext
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            pipeline.push({
                $match: {
                    $or: [
                        {
                            "platform.platformname": {
                                $regex: escapedSearchText,
                                $options: "i"
                            }
                        },
                        {
                            "requister.profilename": {
                                $regex: escapedSearchText,
                                $options: "i"
                            }
                        }
                    ]
                }
            });
        }



        if (categoryid) {
            let categoryIds = [];

            if (Array.isArray(categoryid)) {
                categoryIds = categoryid;
            } else {
                categoryIds = String(categoryid)
                    .split(",")
                    .map((id) => id.trim())
                    .filter(Boolean);
            }


            categoryIds = [...new Set(categoryIds)];

            if (categoryIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category filter"
                });
            }


            const invalidCategoryIds = categoryIds.filter(
                (id) => !mongoose.isValidObjectId(id)
            );

            if (invalidCategoryIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "One or more category IDs are invalid",
                    invalidCategoryIds
                });
            }


            const categoryObjectIds = categoryIds.map(
                (id) => new mongoose.Types.ObjectId(id)
            );


            const categories = await categorymodle
                .find({
                    _id: {
                        $in: categoryObjectIds
                    }
                })
                .select("platform")
                .lean();

            if (!categories || categories.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No selected categories found"
                });
            }


            const platformIds = categories.flatMap(
                (category) => Array.isArray(category.platform)
                    ? category.platform
                    : []
            );


            const uniquePlatformIds = [
                ...new Map(
                    platformIds.map((id) => [
                        id.toString(),
                        id
                    ])
                ).values()
            ];

            if (uniquePlatformIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No platforms found for selected categories"
                });
            }


            pipeline.push({
                $match: {
                    platformname: {
                        $in: uniquePlatformIds
                    }
                }
            });
        }



        if (minprice !== undefined && minprice !== "") {
            const value = Number(minprice);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid minprice"
                });
            }

            pipeline.push({
                $match: {
                    $expr: {
                        $and: [
                            {
                                $gt: [
                                    "$totalslots",
                                    0
                                ]
                            },
                            {
                                $gte: [
                                    {
                                        $divide: [
                                            "$planprice",
                                            "$totalslots"
                                        ]
                                    },
                                    value
                                ]
                            }
                        ]
                    }
                }
            });
        }



        if (maxprice !== undefined && maxprice !== "") {
            const value = Number(maxprice);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maxprice"
                });
            }

            pipeline.push({
                $match: {
                    $expr: {
                        $and: [
                            {
                                $gt: [
                                    "$totalslots",
                                    0
                                ]
                            },
                            {
                                $lte: [
                                    {
                                        $divide: [
                                            "$planprice",
                                            "$totalslots"
                                        ]
                                    },
                                    value
                                ]
                            }
                        ]
                    }
                }
            });
        }



        if (minmember !== undefined && minmember !== "") {
            const value = Number(minmember);

            if (!Number.isInteger(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid minmember"
                });
            }

            pipeline.push({
                $match: {
                    $expr: {
                        $gte: [
                            {
                                $size: {
                                    $ifNull: [
                                        "$members",
                                        []
                                    ]
                                }
                            },
                            value
                        ]
                    }
                }
            });
        }



        if (maxmember !== undefined && maxmember !== "") {
            const value = Number(maxmember);

            if (!Number.isInteger(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid maxmember"
                });
            }

            pipeline.push({
                $match: {
                    $expr: {
                        $lte: [
                            {
                                $size: {
                                    $ifNull: [
                                        "$members",
                                        []
                                    ]
                                }
                            },
                            value
                        ]
                    }
                }
            });
        }



        if (
            planvalidityday !== undefined &&
            planvalidityday !== ""
        ) {
            const value = Number(planvalidityday);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid planvalidityday"
                });
            }

            pipeline.push({
                $match: {
                    planvalidityday: {
                        $gte: value
                    }
                }
            });
        }



        if (slots !== undefined && slots !== "") {
            const value = Number(slots);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid slots"
                });
            }

            pipeline.push({
                $match: {
                    totalslots: {
                        $gte: value
                    }
                }
            });
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



        const requests =
            await platformsharerequestmodel.aggregate(
                pipeline
            );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No requests found"
            });
        }

        res.set(
            "Cache-Control",
            "public, max-age=300"
        );

        return res.status(200).json({
            success: true,
            message: "Requests found",
            requests
        });

    } catch (error) {
        console.error(
            "SHOW REQUEST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const applyforrequest = async (req, res) => {
    try {
        const userid = req.userId;

        const { requestid } = req.body;

        const request =
            await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.members.some(member =>
            member.equals(userid))) {

            return res.status(400).json({
                success: false,
                message: "You have already accepted for this request"
            });
        }

        const requestaplicant =
            await aplicantmodel.findOne({
                request: requestid,
                platformname: request.platformname
            });

        if (!requestaplicant) {

            const newaplicant = new aplicantmodel({
                request: requestid,
                platformname: request.platformname,
                applicant: [userid]
            });

            await newaplicant.save();

            return res.status(200).json({
                success: true,
                message: "Applied for request successfully"
            });
        }

        const existingaplicant =
            requestaplicant.applicant.some(
                aplicant => aplicant.equals(userid)
            );

        if (existingaplicant) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this request"
            });
        }

        requestaplicant.applicant.push(userid);

        await requestaplicant.save();

        return res.status(200).json({
            success: true,
            message: "Applied for request successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const showapplicants = async (req, res) => {
    try {
        const userid = req.userId;

        const { requestid } = req.params;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const request =
            await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.requister.toString() !== userid.toString()) {
            return res.status(402).json({
                success: false,
                message: "Unauthorized only requester can accept applicant"
            });
        }

        const applicant = await aplicantmodel
            .findOne({ request: requestid })
            .populate("applicant", "profilename avatar reting")
            .select("-__v -request -platformname -status -createdAt");

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: "No applicants found for this request"
            });
        }

        const applicants = applicant.applicant.slice(
            skip,
            skip + limit
        );

        res.set("Cache-Control", "private, max-age=300");

        return res.status(200).json({
            success: true,
            message: "Applicants found",
            applicants,
            page,
            hasMore: skip + limit < applicant.applicant.length
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const acceptapplicant = async (req, res) => {
    try {

        const userid = req.userId;

        const {
            requestid,
            aplicantid
        } = req.body;

        if (!requestid || !aplicantid) {
            return res.status(400).json({
                success: false,
                message: "requestid and aplicantid are required"
            });
        }

        const request = await platformsharerequestmodel
            .findById(requestid)
            .populate("platformname", "platformname");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        // Only requester can accept applicants
        if (request.requister.toString() !== userid.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized, only requester can accept applicant"
            });
        }

        // Find applicant
        const aplicant = await aplicantmodel.findOne({
            request: requestid,
            applicant: aplicantid
        });

        if (!aplicant) {
            return res.status(404).json({
                success: false,
                message: "Applicant not found"
            });
        }

        // Check whether request is already full
        if (request.members.length + 1 >= request.totalslots) {
            return res.status(400).json({
                success: false,
                message: "Request has already reached maximum number of members"
            });
        }

        // Safety check: applicant is already a member
        if (
            request.members.some(member =>
                member.equals(aplicantid)
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Applicant is already a member of this request"
            });
        }

        // Add applicant to request members
        request.members.push(aplicantid);

        // Mark request as full when all slots are occupied
        if (request.members.length + 1 === request.totalslots) {
            request.status = "full";
        }

        await request.save();

        // Remove applicant from applicant list after acceptance
        await aplicantmodel.deleteOne({
            request: requestid,
            applicant: aplicantid
        });

        // Create temporary chat if it doesn't already exist
        const tempmessage = await tempChatModel.findOne({
            request: requestid
        });

        if (!tempmessage) {
            await tempChatModel.create({
                request: requestid
            });
        }

        // Notify accepted applicant
        await notificationmodel.create({
            user: aplicantid,
            message:
                "You have been accepted for " +
                request.platformname.platformname +
                " request"
        });

        return res.status(200).json({
            success: true,
            message: "Applicant accepted successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const showrequeststatus = async (req, res) => {

    console.log("showrequeststatus called");

    try {

        const userid = req.userId;

        res.set("Cache-Control", "private, max-age=3600");

        const { requestid } = req.params;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        const request = await platformsharerequestmodel
            .findById(requestid)
            .select("-__v -createdAt -proofimage -planvalidityday")
            .populate("members", "profilename");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (!request.requister) {
            return res.status(500).json({
                success: false,
                message: "Requester information is missing"
            });
        }

        if (request.requister.toString() === userid.toString()) {
            return res.status(200).json({
                success: true,
                message: "You are the requester of this request",
                status: "requester"
            });
        }

        if (
            request.members.some(
                member => member._id.toString() === userid.toString()
            )
        ) {
            return res.status(200).json({
                success: true,
                message: "You are a member of this request",
                status: "accepted"
            });
        }

        return res.status(200).json({
            success: true,
            message: "You are not a member of this request",
            status: "pending"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export const removeapplicant = async (req, res) => {
    try {
        const userid = req.userId;

        const {
            requestid,
            aplicantid
        } = req.body;

        const request =
            await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.requister.toString() !== userid.toString()) {
            return res.status(402).json({
                success: false,
                message: "Unauthorized only requester can remove applicant"
            });
        }

        const aplicant =
            await aplicantmodel.findOne({
                request: requestid,
                applicant: { $in: aplicantid }
            });

        if (!aplicant) {
            return res.status(404).json({
                success: false,
                message: "Applicant not found"
            });
        }

        request.members =
            request.members.filter(
                member => !member.equals(aplicantid)
            );

        await request.save();

        return res.status(200).json({
            success: true,
            message: "Applicant removed successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const deleterequest = async (req, res) => {
    try {
        const userid = req.userId;

        const { requestid } = req.body;

        const request =
            await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.requister.toString() !== userid.toString()) {
            return res.status(402).json({
                success: false,
                message: "Unauthorized only requester can remove request"
            });
        }

        const deletedrequest =
            await request.deleteOne();

        if (!deletedrequest) {
            return res.status(404).json({
                success: false,
                message: "Request not found to delete"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const myrequest = async (req, res) => {
    try {
        const userid = req.userId;

        const requests =
            await platformsharerequestmodel
                .find({ requister: userid })
                .select("-__v   -createdAt  -requister -proofimage -planvalidityday")
                .populate("members", "profilename avatar");

        if (!requests) {
            return res.status(404).json({
                success: false,
                message: "No requests found"
            });
        }

        res.set("Cache-Control", "public, max-age=300");

        return res.status(200).json({
            success: true,
            message: "Requests found",
            requests
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const myapply = async (req, res) => {
    console.log("myapply called");

    try {
        const userid = req.userId;

        const requests =
            await aplicantmodel
                .find({
                    applicant: userid
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
                            select: "platformname platformimage"
                        },
                        {
                            path: "members",
                            select: "profilename"
                        }
                    ]
                })
                .select("-__v -createdAt");

        if (requests.length === 0) {
            return res.status(204).json({
                success: false,
                message: "No requests found"
            });
        }



        return res.status(200).json({
            success: true,
            message: "Requests found",
            requests
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export const showplatformimage = async (req, res) => {
    try {
        const { platformid } = req.params;
        const platform = await platformmodel.findById(platformid).select("platformimage");
        if (!platform) {
            return res.status(404).json({ success: false, message: "Platform not found" });
        }
        res.set("Cache-Control", "public, max-age=300");
        return res.status(200).json({ success: true, message: "Platform image", platform });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const addplatformimage = async (req, res) => {
    try {
        const { platformid } = req.body;
        const platform = await platformmodel.findById(platformid);
        if (!platform) {
            return res.status(404).json({ success: false, message: "Platform not found" });
        }

        const cloudinaryurl = await uploadtocloudinar(req.file.path);
        if (!cloudinaryurl) {
            return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary" });
        }
        platform.platformimage = cloudinaryurl.secure_url;
        await platform.save();
        return res.status(200).json({ success: true, message: "Platform image added successfully", platform });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


export const alredyappliedornot = async (req, res) => {
    try {
        const userid = req.userId;

        const requestid = req.params.requestid;

        const request =
            await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }
        if (request.requister.toString() === userid.toString()) {
            return res.status(200).json({
                success: true,
                message: "You are the requester of this request"
            });
        }
        const alreadyAccepted =
            (request.members || []).some(
                member => member.equals(userid)
            );

        if (alreadyAccepted) {
            return res.status(400).json({
                success: false,
                message: "You have already accepted for this request"
            });
        }
        const applicant = await aplicantmodel.findOne({
            request: requestid,
            applicant: { $in: [userid] }
        });

        if (applicant) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this request"
            });
        }
        return res.status(200).json({
            success: true,
            message: "You can apply for this request"
        });

    } catch (error) {

        console.error(
            "alredyappliedornot error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const addupiid = async (req, res) => {
    try {
        const userid = req.userId;

        const { upiid } = req.body;

        if (!upiid) {
            return res.status(400).json({
                success: false,
                message: "UPI ID is required"
            });
        }

        const user =
            await usermodel.findById(userid);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.upiid = upiid;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "UPI ID added successfully",
            user
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const updateupiid = async (req, res) => {
    try {
        const userid = req.userId;

        const { upiid } = req.body;

        if (!upiid) {
            return res.status(400).json({
                success: false,
                message: "UPI ID is required"
            });
        }

        const user =
            await usermodel.findByIdAndUpdate(
                userid,
                { upiid: upiid },
                { new: true }
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "UPI ID updated successfully",
            user
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
export const showupiid = async (req, res) => {
    try {

        const sellerid = req.params.userid;

        if (!sellerid) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const seller =
            await usermodel.findById(sellerid)
                .select("upiid");

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "UPI ID found",
            seller
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const showrequestdetails = async (req, res) => {
    try {
        const { requestid } = req.params;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });
        }

        const request = await platformsharerequestmodel.findById(requestid)
            .populate("requister", "profilename avatar")
            .populate("platformname", "platformname platformimage")
            .populate("members", "profilename avatar");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request found",
            request
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}


export const deletefalserequests = async (req, res) => {

    try {

        const cleanupKey = "false_requests_cleanup";

        // Check if cleanup was recently performed
        const alreadyCleaned = await redis.get(cleanupKey);

        if (alreadyCleaned) {
            return res.status(200).json({
                success: true,
                message: "Cleanup already performed recently"
            });
        }

        // Delete false requests
        const falserequests = await platformsharerequestmodel.deleteMany({
            proofimage: null,
            planvalidityday: null,
            totalslots: null,
            planprice: null,
            planname: null
        });

        // Set Redis key for 10 minutes
        await redis.set(cleanupKey, "1", "EX", 600);

        return res.status(200).json({
            success: true,
            message: "False requests deleted successfully",
            deletedCount: falserequests.deletedCount
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const saverequest = async (req, res) => {
    try {

        const userid = req.userId;
        const { requestid } = req.body;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
            });
        }

        // Check whether request exists
        const request = await platformsharerequestmodel.findById(requestid);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        // Check whether already saved
        const alreadySaved = await savedrequestmodel.findOne({
            user: userid,
            request: requestid
        });

        if (alreadySaved) {
            return res.status(400).json({
                success: false,
                message: "Request already saved"
            });
        }

        // Save request
        await savedrequestmodel.create({
            user: userid,
            request: requestid
        });

        return res.status(201).json({
            success: true,
            message: "Request saved successfully"
        });

    } catch (error) {

        console.log(error);

        // Handles duplicate key in case two requests arrive together
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Request already saved"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const showsavedrequests = async (req, res) => {
    try {

        const userid = req.userId;

        const savedrequests = await savedrequestmodel
            .find({ user: userid })
            .populate("request")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: savedrequests.length,
            savedrequests
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const alredysavedornot = async (req, res) => {
    try {

        const userid = req.userId;
        const { requestid } = req.params;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
            });
        }

        const savedrequest = await savedrequestmodel.findOne({
            user: userid,
            request: requestid
        });

        return res.status(200).json({
            success: true,
            saved: !!savedrequest
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

