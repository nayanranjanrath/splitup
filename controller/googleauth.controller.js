import { OAuth2Client } from "google-auth-library";
import usermodel from "../models/user.model.js";
import { extractuserid, generateaccessandrefreshtoken } from "./controllers.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
    try {

        const token = req.body.token;
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        if (!ticket) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        let existingUser = await usermodel.findOne({
            email: payload.email
        });

        if (existingUser) {
            const { accessToken, refreshToken } = await generateaccessandrefreshtoken(existingUser._id);
            return res.status(200).json({ message: "User already exists" });
        }

        const newUser = await usermodel.create({
            fullname: payload.name,
            email: payload.email,
            avatar: payload.picture,
            googleId: payload.sub
        });

        const { accesstoken, refreshtoken } = await generateaccessandrefreshtoken(newUser._id);
        newUser.refreshtoken = refreshtoken;
        await newUser.save();
        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 10 * 24 * 60 * 60 * 1000,
        }

        return res.status(200).cookie("accesstoken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json({ success: true, message: "User logged in successfully", user })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const adduserdetails = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const { profilename, phoneno, upiid } = req.body
        if (!profilename) {
            return res.status(400).json({ message: "Profile name and user ID are required" });
        }

        const userid = extractuserid(token)
        if (!userid) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const existingUser = await usermodel.findById(userid._id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        existingUser.profilename = profilename;
        existingUser.phoneno = phoneno;
        existingUser.upiid = upiid;
        await existingUser.save();
        return res.status(200).json({ message: "User details added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
