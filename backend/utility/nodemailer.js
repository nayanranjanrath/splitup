import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});

export const sendOTPEmail = async (email, otp) => {
    console.log("reached Brevo mailer");

    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: "SplitUp",
                email: "splitup55@gmail.com",
            },

            to: [
                {
                    email: email,
                },
            ],

            subject: "Your SplitUp Verification Code",

            htmlContent: `
                <!DOCTYPE html>
                <html>
                <body style="
                    margin: 0;
                    padding: 30px;
                    background-color: #f4f7fb;
                    font-family: Arial, Helvetica, sans-serif;
                ">

                    <div style="
                        max-width: 520px;
                        margin: auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                    ">

                        <div style="
                            background: #142247;
                            padding: 30px;
                            text-align: center;
                        ">
                            <h1 style="
                                margin: 0;
                                color: white;
                            ">
                                SplitUp
                            </h1>

                            <p style="
                                color: #cbd5e1;
                                margin: 8px 0 0;
                            ">
                                Subscription Sharing Made Simple
                            </p>
                        </div>

                        <div style="padding: 35px;">

                            <h2 style="
                                color: #1e293b;
                                margin-top: 0;
                            ">
                                Verify your email
                            </h2>

                            <p style="
                                color: #64748b;
                                line-height: 1.6;
                            ">
                                Thanks for signing up for SplitUp.
                                Use the verification code below to
                                complete your registration.
                            </p>

                            <div style="
                                margin: 25px 0;
                                padding: 20px;
                                text-align: center;
                                background: #f1f5f9;
                                border-radius: 10px;
                                border: 1px solid #dbe3ee;
                            ">

                                <p style="
                                    margin: 0 0 10px;
                                    color: #64748b;
                                    font-size: 12px;
                                    letter-spacing: 1.5px;
                                ">
                                    VERIFICATION CODE
                                </p>

                                <div style="
                                    font-size: 34px;
                                    font-weight: bold;
                                    letter-spacing: 8px;
                                    color: #142247;
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

                            <p style="
                                color: #475569;
                                line-height: 1.6;
                            ">
                                This code will expire in
                                <strong>5 minutes</strong>.
                            </p>

                            <div style="
                                margin-top: 20px;
                                padding: 12px 15px;
                                background: #fff7ed;
                                border-left: 4px solid #f59e0b;
                                border-radius: 6px;
                            ">
                                <p style="
                                    margin: 0;
                                    color: #9a3412;
                                    font-size: 13px;
                                ">
                                    <strong>Security notice:</strong>
                                    Never share this verification code
                                    with anyone.
                                </p>
                            </div>

                            <p style="
                                margin-top: 30px;
                                color: #94a3b8;
                                font-size: 12px;
                            ">
                                If you did not request this code,
                                you can safely ignore this email.
                            </p>

                        </div>

                    </div>

                </body>
                </html>
            `,

            text: `
SplitUp - Email Verification

Your verification code is:

${otp}

This code expires in 5 minutes.

If you did not request this code, you can safely ignore this email.

Never share this verification code with anyone.
            `,
        });

        console.log("Email sent successfully:", result);

        return result;

    } catch (error) {
        console.error("Brevo error:", error);
        throw error;
    }
};


export const reportusermail = async (email, msg) => {
    console.log("reached Brevo mailer");

    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: "SplitUp",
                email: "splitup55@gmail.com",
            },

            to: [
                {
                    email: email,
                },
            ],

            subject: "SplitUp - Report Response",

            htmlContent: `
                <div style="
                    font-family: Arial, Helvetica, sans-serif;
                    max-width: 520px;
                    margin: auto;
                    padding: 30px;
                ">

                    <h1 style="color: #142247;">
                        SplitUp
                    </h1>

                    <h2>
                        Report Response
                    </h2>

                    <p style="
                        color: #475569;
                        line-height: 1.6;
                    ">
                        ${msg}
                    </p>

                    <p style="
                        margin-top: 30px;
                        color: #94a3b8;
                        font-size: 12px;
                    ">
                        © ${new Date().getFullYear()} SplitUp
                    </p>

                </div>
            `,

            text: `
SplitUp - Report Response

${msg}
            `,
        });

        console.log("Email sent successfully:", result);

        return result;

    } catch (error) {
        console.error("Brevo error:", error);
        throw error;
    }
};