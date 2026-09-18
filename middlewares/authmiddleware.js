import { extractuserid } from "../controller/controllers.js";

export const authMiddleware = (req, res, next) => {

    try {

        const token = req.cookies?.accesstoken;

        // No access token at all
        if (!token) {
            return res.status(401).json({
                success: false,
                code: "NO_ACCESS_TOKEN",
                message: "Unauthorized"
            });
        }

        let userid;

        try {

            userid = extractuserid(token);

        } catch (error) {

            // Access token exists but has expired
            if (error.name === "TokenExpiredError") {

                return res.status(403).json({
                    success: false,
                    code: "ACCESS_TOKEN_EXPIRED",
                    message: "Access token expired"
                });

            }

            // Token exists but is invalid
            return res.status(401).json({
                success: false,
                code: "INVALID_ACCESS_TOKEN",
                message: "Invalid access token"
            });
        }

        // Store user ID in request
        req.userId = userid._id;

        // Continue to controller
        next();

    } catch (error) {

        console.error("Authentication middleware error:", error);

        return res.status(401).json({
            success: false,
            code: "AUTHENTICATION_ERROR",
            message: "Unauthorized"
        });
    }
};