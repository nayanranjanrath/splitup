import nodemailer from "nodemailer";
console.log(process.env.EMAIL_USER,process.env.EMAIL_PASS)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  console.log("reached node mailer ")
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Verification Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });

  console.log("Email sent successfully");
};