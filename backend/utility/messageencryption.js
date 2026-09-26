import crypto from "crypto";

const KEY = Buffer.from(process.env.MESSAGE_KEY, "hex");

export function encryptMessage(message) {

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        KEY,
        iv
    );

    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        encryptedMessage: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex")
    };
}


export const decryptMessage = (encryptedMessage, iv, authTag) => {
    try {
        const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        KEY,
        Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
    } catch (error) {
        console.log(error)
        return null
    }
};