import nodemailer from "nodemailer";

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    // Force IPv4
    family: 4,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOTPEmail = async (email, otp) => {
    console.log("reached node mailer");

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Verification Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    console.log("Email sent successfully");
};

export const reportusermail = async (email, msg) => {
    console.log("reached node mailer");

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Report Response",
        text: msg,
    });

    console.log("Email sent successfully");
};