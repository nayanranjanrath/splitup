import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
    console.log("reached resend mailer");

    const { data, error } = await resend.emails.send({
        from: "SplitUp <onboarding@resend.dev>",
        to: [email],
        subject: "Your SplitUp Verification Code",

        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>SplitUp OTP Verification</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f4f7fb;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="background-color: #f4f7fb; padding: 40px 15px;"
            >
                <tr>
                    <td align="center">

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                max-width: 520px;
                                background-color: #ffffff;
                                border-radius: 12px;
                                overflow: hidden;
                            "
                        >

                            <!-- Header -->
                            <tr>
                                <td style="
                                    background-color: #142247;
                                    padding: 28px 30px;
                                    text-align: center;
                                ">
                                    <h1 style="
                                        margin: 0;
                                        color: #ffffff;
                                        font-size: 28px;
                                        letter-spacing: 1px;
                                    ">
                                        SplitUp
                                    </h1>

                                    <p style="
                                        margin: 8px 0 0;
                                        color: #cbd5e1;
                                        font-size: 14px;
                                    ">
                                        Subscription Sharing Made Simple
                                    </p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 35px 35px 25px;">

                                    <h2 style="
                                        margin: 0 0 15px;
                                        color: #1e293b;
                                        font-size: 22px;
                                    ">
                                        Verify your email
                                    </h2>

                                    <p style="
                                        margin: 0 0 20px;
                                        color: #64748b;
                                        font-size: 15px;
                                        line-height: 1.6;
                                    ">
                                        Thanks for signing up for SplitUp!
                                        Please use the verification code below
                                        to complete your registration.
                                    </p>

                                    <!-- OTP Box -->
                                    <table
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        border="0"
                                    >
                                        <tr>
                                            <td align="center">

                                                <div style="
                                                    background-color: #f1f5f9;
                                                    border: 1px solid #dbe3ee;
                                                    border-radius: 10px;
                                                    padding: 20px 15px;
                                                    margin: 10px 0 20px;
                                                ">

                                                    <p style="
                                                        margin: 0 0 8px;
                                                        color: #64748b;
                                                        font-size: 12px;
                                                        text-transform: uppercase;
                                                        letter-spacing: 1.5px;
                                                    ">
                                                        Verification Code
                                                    </p>

                                                    <div style="
                                                        color: #142247;
                                                        font-size: 34px;
                                                        font-weight: bold;
                                                        letter-spacing: 8px;
                                                        line-height: 1.3;
                                                    ">
                                                        ${otp}
                                                    </div>

                                                    <p style="
                                                        margin: 12px 0 0;
                                                        color: #94a3b8;
                                                        font-size: 12px;
                                                    ">
                                                        Select and copy this code
                                                    </p>

                                                </div>

                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Expiration -->
                                    <p style="
                                        margin: 0 0 12px;
                                        color: #475569;
                                        font-size: 14px;
                                        line-height: 1.6;
                                    ">
                                        This verification code will expire in
                                        <strong>5 minutes</strong>.
                                    </p>

                                    <p style="
                                        margin: 0;
                                        color: #64748b;
                                        font-size: 14px;
                                        line-height: 1.6;
                                    ">
                                        If you did not request this code, you can
                                        safely ignore this email.
                                    </p>

                                </td>
                            </tr>

                            <!-- Security Notice -->
                            <tr>
                                <td style="
                                    padding: 0 35px 30px;
                                ">

                                    <div style="
                                        background-color: #fff7ed;
                                        border-left: 4px solid #f59e0b;
                                        padding: 12px 15px;
                                        border-radius: 6px;
                                    ">
                                        <p style="
                                            margin: 0;
                                            color: #9a3412;
                                            font-size: 13px;
                                            line-height: 1.5;
                                        ">
                                            <strong>Security notice:</strong>
                                            Never share this verification code
                                            with anyone, including SplitUp support.
                                        </p>
                                    </div>

                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="
                                    border-top: 1px solid #e2e8f0;
                                    padding: 22px 30px;
                                    text-align: center;
                                ">

                                    <p style="
                                        margin: 0;
                                        color: #94a3b8;
                                        font-size: 12px;
                                    ">
                                        © ${new Date().getFullYear()} SplitUp.
                                        All rights reserved.
                                    </p>

                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>
            </table>

        </body>
        </html>
        `,

        // Fallback for email clients that don't support HTML
        text: `
SplitUp - Email Verification

Your verification code is:

${otp}

This code expires in 5 minutes.

If you did not request this code, you can safely ignore this email.

Security notice:
Never share this verification code with anyone.
        `,
    });

    if (error) {
        console.error("Resend error:", error);
        throw new Error("Failed to send OTP email");
    }

    console.log("Email sent successfully:", data);
};


export const reportusermail = async (email, msg) => {
    console.log("reached resend mailer");

    const { data, error } = await resend.emails.send({
        from: "SplitUp <onboarding@resend.dev>",
        to: [email],
        subject: "SplitUp - Report Response",

        html: `
        <!DOCTYPE html>
        <html>
        <body style="
            margin: 0;
            padding: 40px 15px;
            background-color: #f4f7fb;
            font-family: Arial, Helvetica, sans-serif;
        ">

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
            >
                <tr>
                    <td align="center">

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                max-width: 520px;
                                background-color: #ffffff;
                                border-radius: 12px;
                                padding: 35px;
                            "
                        >

                            <tr>
                                <td>

                                    <h1 style="
                                        margin: 0 0 20px;
                                        color: #142247;
                                    ">
                                        SplitUp
                                    </h1>

                                    <h2 style="
                                        margin: 0 0 15px;
                                        color: #1e293b;
                                    ">
                                        Report Response
                                    </h2>

                                    <p style="
                                        color: #475569;
                                        font-size: 15px;
                                        line-height: 1.6;
                                    ">
                                        ${msg}
                                    </p>

                                    <p style="
                                        margin-top: 30px;
                                        color: #94a3b8;
                                        font-size: 12px;
                                    ">
                                        © ${new Date().getFullYear()} SplitUp.
                                        All rights reserved.
                                    </p>

                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>
            </table>

        </body>
        </html>
        `,

        text: `
SplitUp - Report Response

${msg}
        `,
    });

    if (error) {
        console.error("Resend error:", error);
        throw new Error("Failed to send report email");
    }

    console.log("Email sent successfully:", data);
};