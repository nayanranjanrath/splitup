import { OAuth2Client } from "google-auth-library";
import usermodel from "../models/user.model.js";
import { generateaccessandrefreshtoken } from "./controllers.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required"
            });
        }

        // --------------------------------------------------
        // VERIFY GOOGLE ID TOKEN
        // --------------------------------------------------

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        if (!payload.email || !payload.email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google email is not verified"
            });
        }

        console.log("Google user:", {
            email: payload.email,
            googleId: payload.sub,
            name: payload.name,
        });

        // --------------------------------------------------
        // COOKIE OPTIONS
        // --------------------------------------------------

        const options = {
            httpOnly: true,
            secure: false,       // localhost
            sameSite: "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000,
            path: "/",
        };

        // --------------------------------------------------
        // CHECK EXISTING USER
        // --------------------------------------------------

        let existingUser = await usermodel.findOne({
            email: payload.email
        });

        if (existingUser) {

            const { accesstoken, refreshtoken } =
                await generateaccessandrefreshtoken(existingUser._id);

            return res
                .status(200)
                .cookie("accesstoken", accesstoken, options)
                .cookie("refreshtoken", refreshtoken, options)
                .json({
                    success: true,
                    message: "User logged in successfully"
                });
        }

        // --------------------------------------------------
        // CREATE TEMPORARY PROFILE NAME
        // --------------------------------------------------
        // profilename is required and max 10 chars.
        // Google "sub" is unique, so this gives us a
        // practically unique temporary username.

        const tempProfileName =
            "g" + String(payload.sub).slice(-9);

        // --------------------------------------------------
        // CREATE NEW GOOGLE USER
        // --------------------------------------------------

        const newUser = await usermodel.create({
            profilename: tempProfileName,
            fullname: payload.name?.trim() || "Google User",
            email: payload.email.toLowerCase().trim(),
            avatar: payload.picture || null,
            googleId: payload.sub,
        });

        console.log("Google user created:", newUser._id);

        // --------------------------------------------------
        // GENERATE OUR APP JWT TOKENS
        // --------------------------------------------------

        const { accesstoken, refreshtoken } =
            await generateaccessandrefreshtoken(newUser._id);

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res
            .status(200)
            .cookie("accesstoken", accesstoken, options)
            .cookie("refreshtoken", refreshtoken, options)
            .json({
                success: true,
                message: "User registered successfully",
                user: {
                    _id: newUser._id,
                    email: newUser.email,
                    fullname: newUser.fullname,
                    avatar: newUser.avatar,
                    googleId: newUser.googleId,
                }
            });

    } catch (error) {
        console.error("Google auth error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const adduserdetails = async (req, res) => {
    try {
        const { profilename, phoneno, upiid } = req.body;

        if (!profilename) {
            return res.status(400).json({
                message: "Profile name and user ID are required"
            });
        }

        const userid = req.userId;

        const existingUser = await usermodel.findById(userid);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        existingUser.profilename = profilename;
        existingUser.phoneno = phoneno;
        existingUser.upiid = upiid;

        await existingUser.save();

        return res.status(200).json({
            message: "User details added successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const avilibleprofilename = async (req, res) => {
    try {
        const { profilename } = req.params;
        if (!profilename) {
            return res.status(400).json({
                message: "Profile name is required"
            });
        }
        const existingUser = await usermodel.findOne({
            profilename
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Profile name already exists"
            });
        }
        return res.status(200).json({
            message: "Profile name is available"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}