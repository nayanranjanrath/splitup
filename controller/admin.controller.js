import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import adminModel from "../models/admin.model.js";

import platformsharerequestmodel from "../models/platformsharerequest.model.js";
import usermodel from "../models/user.model.js";

import reportusermodel from "../models/reportuser.model.js";
import reportbugmodel from "../models/reportbug.model.js";


/*
==================================================
ADMIN LOGIN
==================================================
*/

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find admin
    const admin = await adminModel.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check whether admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /*
    ------------------------------------------
    CREATE ADMIN SESSION
    ------------------------------------------
    */

    const sessionId = crypto.randomBytes(32).toString("hex");

    // Session valid for 8 hours
    const sessionExpiresAt = new Date(
      Date.now() + 8 * 60 * 60 * 1000
    );

    admin.sessionId = sessionId;
    admin.sessionExpiresAt = sessionExpiresAt;
    admin.lastLogin = new Date();

    await admin.save();

    /*
    ------------------------------------------
    STORE SESSION ID IN COOKIE
    ------------------------------------------
    */

    res.cookie("admin_session", sessionId, {
      httpOnly: true,

      // HTTPS in production
      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge: 8 * 60 * 60 * 1000,

      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",

      admin: {
        id: admin._id,
        username: admin.username,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
==================================================
ADMIN AUTH MIDDLEWARE
==================================================
*/

export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.admin_session;

    // No session cookie
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    /*
    ------------------------------------------
    FIND ADMIN USING SESSION ID
    ------------------------------------------
    */

    const admin = await adminModel.findOne({
      sessionId: sessionId,
      isActive: true,
      sessionExpiresAt: {
        $gt: new Date(),
      },
    });

    // Session doesn't exist or has expired
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired admin session",
      });
    }

    /*
    ------------------------------------------
    ATTACH ADMIN TO REQUEST
    ------------------------------------------
    */

    req.admin = admin;

    next();

  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
==================================================
ADD ADMIN
ONLY SUPERADMIN CAN USE THIS
==================================================
*/

export const addAdmin = async (req, res) => {
  try {
    /*
    ------------------------------------------
    CHECK SUPERADMIN
    ------------------------------------------
    */

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    if (req.admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can add admins",
      });
    }

    const {
      username,
      email,
      password,
      fullname,
    } = req.body;

    /*
    ------------------------------------------
    VALIDATE INPUT
    ------------------------------------------
    */

    if (!username || !email || !password || !fullname) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    /*
    ------------------------------------------
    CHECK EXISTING ADMIN
    ------------------------------------------
    */

    const existingAdmin = await adminModel.findOne({
      $or: [
        {
          email: normalizedEmail,
        },
        {
          username: normalizedUsername,
        },
      ],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email or username already exists",
      });
    }

    /*
    ------------------------------------------
    HASH PASSWORD
    ------------------------------------------
    */

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    /*
    ------------------------------------------
    CREATE ADMIN
    ------------------------------------------
    */

    const admin = await adminModel.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      fullname: fullname.trim(),

      // New admins are ALWAYS normal admins
      role: "admin",

      isActive: true,

      sessionId: null,
      sessionExpiresAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Admin added successfully",

      admin: {
        id: admin._id,
        username: admin.username,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("ADD ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
==================================================
DELETE ADMIN
ONLY SUPERADMIN CAN USE THIS
==================================================
*/

export const deleteAdmin = async (req, res) => {
  try {
    /*
    ------------------------------------------
    CHECK SUPERADMIN
    ------------------------------------------
    */

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    if (req.admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can delete admins",
      });
    }

    const { adminid } = req.params;

    /*
    ------------------------------------------
    VALIDATE ADMIN ID
    ------------------------------------------
    */

    if (!mongoose.isValidObjectId(adminid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    /*
    ------------------------------------------
    FIND ADMIN
    ------------------------------------------
    */

    const admin = await adminModel.findById(adminid);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    /*
    ------------------------------------------
    DON'T ALLOW SUPERADMIN DELETION
    ------------------------------------------
    */

    if (admin.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin cannot be deleted",
      });
    }

    /*
    ------------------------------------------
    DELETE ADMIN
    ------------------------------------------
    */

    await adminModel.findByIdAndDelete(adminid);

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });

  } catch (error) {
    console.error("DELETE ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/*
==================================================
ADMIN LOGOUT
==================================================
*/

export const adminLogout = async (req, res) => {
  try {
    const sessionId = req.cookies?.admin_session;

    if (sessionId) {
      await adminModel.findOneAndUpdate(
        {
          sessionId,
        },
        {
          $set: {
            sessionId: null,
            sessionExpiresAt: null,
          },
        }
      );
    }

    res.clearCookie("admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });

  } catch (error) {
    console.error("ADMIN LOGOUT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};






export const getAdminStats = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const [
      totalUsers,
      totalRequestGroups,
      totalReports,
      totalBugs,
    ] = await Promise.all([
      usermodel.countDocuments(),
      platformsharerequestmodel.countDocuments(),
      reportusermodel.countDocuments(),
      reportbugmodel.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalRequestGroups,
        totalReports,
        totalBugs,
      },
    });
  } catch (error) {
    console.error("GET ADMIN STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// controller/tempAdmin.controller.js



export const createSuperAdmin = async (req, res) => {
  try {
    const { username, email, password, fullname } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await adminModel.create({
      username,
      email,
      password: hashedPassword,
      fullname,
      role: "superadmin",
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Superadmin created successfully",
      admin
    });

  } catch (error) {
    console.error("Create superadmin error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};