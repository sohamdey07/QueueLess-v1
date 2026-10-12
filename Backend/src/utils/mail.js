import crypto from 'crypto';

//function to generate 6 digit otp
function generateOTP(){
    return crypto.randomInt(100000, 999999).toString();
}

function otpHashing(otp){
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function getOtpHtml(otp){
    return `
    <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p style="font-size: 18px; color: #555;">Please use the following OTP to complete your verification:</p>
        <div style="font-size: 24px; font-weight: bold; color: #007BFF; margin: 20px 0;">${otp}</div>
        <p style="font-size: 14px; color: #999;">This OTP is valid for a limited time. Please do not share it with anyone.</p>
    </div>
    `;
}

function getPasswordResetEmailHtml({ resetUrl }) {
    const directResetButton = resetUrl ? `
        <div style="text-align: center; margin: 32px 0 28px;">
            <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 38px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); letter-spacing: 0.2px;">
                Reset Password
            </a>
            <p style="font-size: 12.5px; color: #64748b; margin-top: 12px;">This secure link is valid for 15 minutes and can only be used once.</p>
        </div>
    ` : '';

    const rawLinkSection = resetUrl ? `
        <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; word-break: break-all;">
            <p style="margin: 0 0 6px; font-weight: 600; color: #475569;">Button not working? Copy and paste this link in your browser:</p>
            <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
        </div>
    ` : '';

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 36px 30px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; color: #0f172a; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 10px 16px; background: #eff6ff; border-radius: 12px; margin-bottom: 14px;">
                <span style="font-size: 22px; font-weight: 800; color: #0f172a;">Queue<span style="color: #2563eb;">Less</span></span>
            </div>
            <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Reset Your Password</h2>
            <p style="color: #64748b; font-size: 14.5px; margin: 0; line-height: 1.5;">We received a request to reset the password for your QueueLess account. Click the button below to set a new password.</p>
        </div>

        ${directResetButton}

        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 20px 0 12px;">If you didn't request a password reset, you can safely ignore this email — your account remains secure and no changes will be made.</p>

        ${rawLinkSection}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 18px;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} QueueLess System. All rights reserved.</p>
    </div>
    `;
}

function getPasswordResetOtpHtml(arg) {
    if (typeof arg === 'string') {
        return getPasswordResetEmailHtml({ resetUrl: arg });
    }
    return getPasswordResetEmailHtml(arg || {});
}

export { generateOTP, getOtpHtml, getPasswordResetOtpHtml, getPasswordResetEmailHtml, otpHashing };