
import reportusermodel from "../models/reportuser.model.js";
import reportbugmodel from "../models/reportbug.model.js";
import usermodel from "../models/user.model.js";
import { extractuserid } from "./controllers.js";
import { reportusermail } from "../utility/nodemailer.js";









export const reportuser = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const { reporteduserid, reason } = req.body;
        if (!reporteduserid || !reason) {
            return res.status(400).json({ success: false, message: "Reported user ID and reason are required" });
        }
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const reporteduser = await usermodel.findById(reporteduserid);
        if (!reporteduser) {
            return res.status(404).json({ success: false, message: "Reported user not found" });
        }
        const report = new reportusermodel({
            reporter: userid._id,
            reporteduser: reporteduserid,
            reason: reason
        });
        await report.save();
        return res.status(200).json({ success: true, message: "Report submitted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const reportabug = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ success: false, message: "Bug description are required" });
        }
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const report = new reportbugmodel({
            reporter: userid._id,
            report: description
        });
        await report.save();
        return res.status(200).json({ success: true, message: "Bug reported successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const showreports = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (userid._id !== "6a4b51ae0f1db34bcb90f56d") {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can see reports" });
        }

        const reports = await reportusermodel.find().populate("reporter", "profilename avatar").populate("reporteduser", "profilename avatar").select("-__v");

        if (!reports || reports.length === 0) {
            return res.status(404).json({ success: false, message: "No reports found" });
        }

 res.set("Cache-Control", "public, max-age=3600");
        return res.status(200).json({ success: true, message: "Reports found", reports });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });

    }
}

export const showbugs = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        if (userid._id !== "6a4b51ae0f1db34bcb90f56d") {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can see reports" });
        }
        const bugs = await reportbugmodel.find().populate("reporter", "profilename avatar").select("-__v");
        if (!bugs || bugs.length === 0) {
            return res.status(404).json({ success: false, message: "No bugs found" });
        }
         res.set("Cache-Control", "public, max-age=3600");
        return res.status(200).json({ success: true, message: "Bugs found", bugs });
    } catch (error) {

    }
}

export const validatereport = async (req, res) => {
    try {
        const token = req.cookies.accesstoken;
        const reporid = req.body.reportid;
        const status = req.body.status;
        if (!reporid || !status) {
            return res.status(400).json({ success: false, message: "Report ID and status is required" });
        }
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const admin = process.env.ADMIN_ID
       
        if (userid._id.toString() !== admin) {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can see reports" });
        }
       const report = await reportusermodel.findById(reporid).populate("reporteduser", "profilename").populate("reporter", "email").select("-__v");
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        const reportedUserName = report.reporteduser.profilename;
        const reporteduseremail = report.reporter.email;
        report.status = status;
       
       

        const message = `
Hello,

Thank you for taking the time to report a user on SplitUp. We appreciate your effort in helping us maintain a safe and respectful community.

We have completed the review of your report regarding the user:

Reported User: ${reportedUserName}

Current Status: ${status}

Our moderation team has carefully reviewed the information provided and has taken the appropriate action based on our Community Guidelines and platform policies. Please note that, for privacy and security reasons, we are unable to share specific details about any actions taken on another user's account.

Your reports play an important role in helping us improve the SplitUp community, and we sincerely appreciate your cooperation.

If you have any additional information related to this report, or if you need further assistance, please don't hesitate to contact our support team.

Thank you for being a valued member of SplitUp.

Best regards,

The SplitUp Team
`;
         const mail = await reportusermail(reporteduseremail, message);
        if (!mail) {
            return res.status(500).json({ success: false, message: "Email not sent" });
        }
        const updatedreport = await report.save();
        if (!updatedreport) {
            return res.status(500).json({ success: false, message: "Report not updated" });
        }
        await report.deleteOne();
        return res.status(200).json({ success: true, message: "Report validated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


export const validatebugs = async(req, res) => {
    try {
          const token = req.cookies.accesstoken;
        const reportbugid = req.body.reportbugid;
        
        if (!reportbugid ) {
            return res.status(400).json({ success: false, message: "Report ID  is required" });
        }
        const userid = extractuserid(token);
        if (!userid) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const admin = process.env.ADMIN_ID
       
        if (userid._id.toString() !== admin) {
            return res.status(403).json({ success: false, message: "Unauthorized only admin can see reports" });
        }

        const report = await reportbugmodel.findById(reportbugid).populate("reporter", "email").select("-__v");
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        
        const reporteduseremail = report.reporter.email;
        const message = `
Hello,

Thank you for taking the time to report a bug on SplitUp.

We have successfully received your bug report .



Our development team will carefully review the information you provided and investigate the issue. Every report helps us improve the reliability, performance, and overall experience of SplitUp.

While we may not be able to provide individual updates for every report, please be assured that your feedback is valuable and will be considered during our development process.

We sincerely appreciate your effort, patience, and support in helping us build a better platform for everyone.

Thank you for being a valued member of the SplitUp community.

Best regards,

The SplitUp Team
`;

        const mail = await reportusermail(reporteduseremail, message);
        if (!mail) {
            return res.status(500).json({ success: false, message: "Email not sent" });
        }
        
        return res.status(200).json({ success: true, message: "Report validated successfully" });
        
    } catch (error) {
        console.log(error);
           return res.status(500).json({ success: false, message: "Internal server error" });
    }
}