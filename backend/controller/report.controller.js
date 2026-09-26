import reportusermodel from "../models/reportuser.model.js";
import reportbugmodel from "../models/reportbug.model.js";
import usermodel from "../models/user.model.js";
import { reportusermail } from "../utility/nodemailer.js";
import notificationmodel from "../models/notification.model.js";



export const reportuser = async (req, res) => {

    try {

        const { reporteduserid, reason } = req.body;

        if (!reporteduserid || !reason) {

            return res.status(400).json({
                success: false,
                message: "Reported user ID and reason are required"
            });

        }

        const userid = req.userId;

        const reporteduser = await usermodel.findById(reporteduserid);

        if (!reporteduser) {

            return res.status(404).json({
                success: false,
                message: "Reported user not found"
            });

        }

        const report = new reportusermodel({

            reporter: userid,

            reporteduser: reporteduserid,

            reason: reason

        });

        await report.save();

        return res.status(200).json({
            success: true,
            message: "Report submitted successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }

}


export const reportabug = async (req, res) => {

    try {

        const { description } = req.body;

        if (!description) {

            return res.status(400).json({
                success: false,
                message: "Bug description are required"
            });

        }

        const userid = req.userId;

        const report = new reportbugmodel({

            reporter: userid,

            report: description

        });

        await report.save();

        const notification = new notificationmodel({

            user: userid,

            message: "Thanks for helping us improve SplitUp! Your bug report has been submitted successfully. We'll look into it as soon as possible.",

        })

        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Bug reported successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }

}


export const showreports = async (req, res) => {
    try {

        // adminAuthMiddleware should already have authenticated the admin
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        const reports = await reportusermodel
            .find()
            .populate("reporter", "profilename avatar email")
            .populate("reporteduser", "profilename avatar")
            .select("-__v")
            .sort({ createdAt: -1 })
            .lean();

        // No pending reports is not a server error
        if (!reports || reports.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No reports found",
                reports: []
            });
        }

        /*
         * Add a common "message" field for the admin frontend.
         *
         * Your database currently stores the user report text
         * in the "reason" field.
         */
        const formattedReports = reports.map((report) => ({
            ...report,

            message:
                report.reason ||
                report.description ||
                ""
        }));

        // Admin/moderation data should not be publicly cached
        res.set("Cache-Control", "private, no-store");

        return res.status(200).json({
            success: true,
            message: "Reports found",
            reports: formattedReports
        });

    } catch (error) {

        console.error("SHOW REPORTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const showbugs = async (req, res) => {
    try {

        // adminAuthMiddleware should already have authenticated the admin
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        const bugs = await reportbugmodel
            .find()
            .populate("reporter", "profilename avatar email")
            .select("-__v")
            .sort({ createdAt: -1 })
            .lean();

        // No pending bugs is not an error
        if (!bugs || bugs.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No bugs found",
                bugs: []
            });
        }

        /*
         * Your DB stores the bug description in "report".
         * We expose it as "message" as well so the admin
         * frontend has one consistent field to display.
         */
        const formattedBugs = bugs.map((bug) => ({
            ...bug,

            message:
                bug.report ||
                bug.description ||
                ""
        }));

        // Do not publicly cache admin/moderation data
        res.set("Cache-Control", "private, no-store");

        return res.status(200).json({
            success: true,
            message: "Bugs found",
            bugs: formattedBugs
        });

    } catch (error) {

        console.error("SHOW BUGS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
export const validatereport = async (req, res) => {
    try {
        console.log("========== VALIDATE USER REPORT ==========");

        const { reportid, status } = req.body;

        console.log("reportid:", reportid);
        console.log("status:", status);
        console.log("admin:", req.admin?._id);

      
        if (!reportid || !status) {
            return res.status(400).json({
                success: false,
                message: "Report ID and status are required"
            });
        }

       

        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

    

        const normalizedStatus =
            String(status).trim().toLowerCase();

        if (
            normalizedStatus !== "reviewed" &&
            normalizedStatus !== "rejected"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid report status"
            });
        }

       

        const report = await reportusermodel
            .findById(reportid)
            .populate(
                "reporteduser",
                "profilename"
            )
            .populate(
                "reporter",
                "profilename email"
            )
            .select("-__v");

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        console.log(
            "Report found:",
            report._id.toString()
        );

     

        if (!report.reporter) {
            return res.status(404).json({
                success: false,
                message: "Reporter not found"
            });
        }

        const reporterEmail =
            report.reporter.email;

        const reporterId =
            report.reporter._id;

        const reportedUserName =
            report.reporteduser?.profilename ||
            "Unknown user";

        console.log(
            "Reporter email:",
            reporterEmail
        );

        if (!reporterEmail) {
            return res.status(400).json({
                success: false,
                message: "Reporter email not found"
            });
        }

      

        const emailStatus =
            normalizedStatus === "reviewed"
                ? "Reviewed"
                : "Rejected";

        const emailMessage = `
Hello,

Thank you for taking the time to report a user on SplitUp.

We have completed the review of your report.

Reported User: ${reportedUserName}

Current Status: ${emailStatus}

Our moderation team has reviewed the information provided and taken the appropriate action according to our Community Guidelines and platform policies.

For privacy and security reasons, we cannot share specific details about any action taken on another user's account.

Your reports help us maintain a safe and respectful SplitUp community.

Thank you for your cooperation and for helping us improve SplitUp.

Best regards,

The SplitUp Team
`;


        console.log("Sending report email...");

        await reportusermail(
            reporterEmail,
            emailMessage
        );

        console.log(
            "Report email completed successfully"
        );

       

        const deletedReport =
            await reportusermodel.findByIdAndDelete(
                reportid
            );

        if (!deletedReport) {
            return res.status(500).json({
                success: false,
                message:
                    "Email sent but report could not be deleted"
            });
        }

        console.log(
            "Report deleted:",
            deletedReport._id.toString()
        );

       

        try {
            await notificationmodel.create({
                user: reporterId,
                message:
                    `Your report has been ${emailStatus.toLowerCase()}. Check your email for more details.`
            });

            console.log(
                "Notification created successfully"
            );

        } catch (notificationError) {

            console.error(
                "NOTIFICATION ERROR:",
                notificationError
            );

           
        }

      

        return res.status(200).json({
            success: true,
            message:
                `Report ${emailStatus.toLowerCase()} successfully`
        });

    } catch (error) {

        console.error(
            "VALIDATE REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Internal server error"
        });
    }
};

export const validatebugs = async (req, res) => {
    try {
        console.log("========== VALIDATE BUG ==========");

        const { reportbugid } = req.body;

        console.log(
            "reportbugid:",
            reportbugid
        );

        console.log(
            "admin:",
            req.admin?._id
        );


        if (!reportbugid) {
            return res.status(400).json({
                success: false,
                message: "Bug report ID is required"
            });
        }

       

        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        

        const bug = await reportbugmodel
            .findById(reportbugid)
            .populate(
                "reporter",
                "profilename email"
            )
            .select("-__v");

        if (!bug) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found"
            });
        }

        console.log(
            "Bug found:",
            bug._id.toString()
        );



        if (!bug.reporter) {
            return res.status(404).json({
                success: false,
                message: "Reporter not found"
            });
        }

        const reporterEmail =
            bug.reporter.email;

        const reporterId =
            bug.reporter._id;

    
        const bugDescription =
            bug.report?.trim() ||
            "No bug description provided";

        console.log(
            "Reporter email:",
            reporterEmail
        );

        console.log(
            "Bug description:",
            bugDescription
        );

        if (!reporterEmail) {
            return res.status(400).json({
                success: false,
                message: "Reporter email not found"
            });
        }

        

        const emailMessage = `
Hello,

Thank you for taking the time to report a bug on SplitUp.

We have successfully reviewed your bug report.

Your reported issue:

${bugDescription}

Our development team has recorded the issue and will investigate it as part of our development process.

Every bug report helps us improve the reliability, performance, and overall experience of SplitUp.

We sincerely appreciate your effort and support.

Thank you for being a valued member of the SplitUp community.

Best regards,

The SplitUp Team
`;

       
        console.log("Sending bug report email...");

        await reportusermail(
            reporterEmail,
            emailMessage
        );

        console.log(
            "Bug report email completed successfully"
        );

     

        const deletedBug =
            await reportbugmodel.findByIdAndDelete(
                reportbugid
            );

        if (!deletedBug) {
            return res.status(500).json({
                success: false,
                message:
                    "Email sent but bug report could not be deleted"
            });
        }

        console.log(
            "Bug deleted:",
            deletedBug._id.toString()
        );

       

        try {
            await notificationmodel.create({
                user: reporterId,
                message:
                    "Your bug report has been reviewed. Check your email for more details."
            });

            console.log(
                "Notification created successfully"
            );

        } catch (notificationError) {

            console.error(
                "NOTIFICATION ERROR:",
                notificationError
            );

          
        }

     

        return res.status(200).json({
            success: true,
            message:
                "Bug report reviewed successfully"
        });

    } catch (error) {

        console.error(
            "VALIDATE BUG ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Internal server error"
        });
    }
};