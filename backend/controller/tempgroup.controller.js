import tempChatModel from "../models/tempchat.model.js";
import path from "path";
import platformsharerequestmodel from "../models/platformsharerequest.model.js";

import paymentproofmodel from "../models/paymentproof.model.js";

import { uploadtocloudinar } from "../utility/cloudinary.js"

import finalChatModel from "../models/finalchat.model.js";

import planmodel from "../models/plan.model.js";

import { convertToJpg } from "../utility/sharp.js";

import fs from "fs"


export const showallgroup = async (req, res) => {

    try {

        const userid = req.userId;

        const requests = await platformsharerequestmodel
            .find({
                $or: [
                    { requister: userid },
                    { members: { $in: [userid] } }
                ]
            })
            .select("_id ")

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "you don't have requests "
            });
        }

        const requestIds = requests.map(request => request._id);

        const groups = await tempChatModel.find({
            request: { $in: requestIds }
        }).populate({
            path: "request",
            select: "platformname requister members status expiresAt",
            populate: [
                {
                    path: "platformname",
                    select: "platformname"
                },
                {
                    path: "requister",
                    select: "profilename"
                },
                {
                    path: "members",
                    select: "profilename avatar"
                }
            ]
        });

        if (!groups) {
            return res.status(404).json({
                success: false,
                message: "you don't have groups "
            });
        }

        res.set("Cache-Control", "public, max-age=300");

        return res.status(200).json({
            success: true,
            message: "groups found",
            groups
        });

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
}


export const sendpaymentproof = async (req, res) => {

    try {

        console.log("REQUEST: POST /sendpaymentproof");
        console.log("BODY:", req.body);

        const requestid = req.body?.requestid;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
            });
        }

        let proofimage = req.file?.path;

        console.log("proof image incoming:", proofimage);

        if (!proofimage) {
            return res.status(400).json({
                success: false,
                message: "payment proof is required"
            });
        }

        const userid = req.userId;

        const request = await platformsharerequestmodel.findById(requestid);

        if (!request) {

            if (fs.existsSync(proofimage)) {
                fs.unlinkSync(proofimage);
            }

            return res.status(404).json({
                success: false,
                message: "request not found"
            });
        }

        const paymentproof = await paymentproofmodel.findOne({
            request: requestid,
            user: userid
        });

        if (
            paymentproof &&
            (
                paymentproof.status === "approved" ||
                paymentproof.status === "pending"
            )
        ) {

            if (fs.existsSync(proofimage)) {
                fs.unlinkSync(proofimage);
            }

            return res.status(400).json({
                success: false,
                message: "payment proof already sent"
            });
        }

        // ALWAYS convert payment proof to a fresh JPG
        const converted = await convertToJpg(proofimage);

        const outputPath = converted.outputPath;

        console.log("converted jpg proof image:", outputPath);

        // Upload JPG to Cloudinary
        const proof = await uploadtocloudinar(outputPath);

        const newproof = new paymentproofmodel({
            request: requestid,
            user: userid,
            proofimage: {
                url: proof.secure_url,
                publicId: proof.public_id
            }
        });

        await newproof.save();

        return res.status(200).json({
            success: true,
            message: "payment proof sent successfully"
        });

    } catch (error) {

        console.log("SEND PAYMENT PROOF ERROR:");
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        });
    }
};
export const aproveusers = async (req, res) => {

    try {

        const paymentproofid = req.body.paymentproofid;

        if (!paymentproofid) {
            return res.status(404).json({
                success: false,
                message: "payment proof id is required "
            });
        }

        const userid = req.userId;

        const payment = await paymentproofmodel
            .findById(paymentproofid)
            .populate("request", "requister")

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "no such paymentproof find "
            });
        }

        if (payment.request.requister.toString() !== userid.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized only requester can aprove users"
            });
        }

        const group = await tempChatModel.findOne({
            request: payment.request
        })

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "no such group find "
            });
        }

        payment.status = "approved"

        await payment.save()

        group.paidUsers.push(payment.user)

        await group.save()

        return res.status(200).json({
            success: true,
            message: "payment proof approved successfully"
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
}


export const rejectusers = async (req, res) => {

    try {

        const paymentproofid = req.body.paymentproofid;

        if (!paymentproofid) {
            return res.status(404).json({
                success: false,
                message: "payment proof id is required "
            });
        }

        const userid = req.userId;

        const payment = await paymentproofmodel
            .findById(paymentproofid)
            .populate("request", "requister")

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "no such paymentproof find "
            });
        }

        if (payment.request.requister.toString() !== userid.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized only requester can aprove users"
            });
        }

        if (payment.status == "approved") {
            return res.status(404).json({
                success: true,
                message: "you cant reject approved payment proof"
            })
        }

        payment.status = "rejected"

        await payment.save()

        return res.status(200).json({
            success: true,
            message: "payment proof rejected successfully"
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
}


export const showallproofimage = async (req, res) => {
    try {

        const { requestid } = req.params;

        if (!requestid) {
            return res.status(400).json({
                success: false,
                message: "requestid is required"
            });
        }

        const payments = await paymentproofmodel
            .find({ request: requestid })
            .populate("user", "profilename avatar")
            .select("-createdAt -__v");

        if (!payments.length) {
            return res.status(404).json({
                success: false,
                message: "No payment proofs found for this request"
            });
        }

        res.set("Cache-Control", "private, max-age=300");

        const data = payments.map(p => ({
            paymentproofid: p._id,
            status: p.status,
            user: p.user,
            urls: Array.isArray(p.proofimage)
                ? p.proofimage.map(img => img.url).filter(Boolean)
                : []
        }));

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const explicitaproveusers = async (req, res) => {

    try {

        

      
        const userid = req.userId;

        const payment = await paymentproofmodel
            .findById(paymentproofid)
            .populate("request", "requister")

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "no such paymentproof find "
            });
        }

        if (payment.request.requister.toString() !== userid.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized only requester can aprove users"
            });
        }

        const group = await tempChatModel.findone({
            request: payment.request
        })

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "no such group find "
            });
        }

        payment.status = "approved"

        await payment.save()

        group.paidUsers.push(payment.user)

        await group.save()

        return res.status(200).json({
            success: true,
            message: "payment proof approved successfully"
        })

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message: "internalserver error"
        })
    }
}



export const getRequestMembers = async (req, res) => {
  try {
    const { requestid } = req.params;

    const shareRequest = await platformsharerequestmodel
      .findById(requestid)
      .select("members  status")
      .populate("members", "avatar profilename");

    if (!shareRequest) {
      return res.status(404).json({
        success: false,
        message: "Platform share request not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request members fetched successfully",
      status: shareRequest.status,
      members: shareRequest.members
    });
  } catch (error) {
    console.error("Error fetching request members:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};