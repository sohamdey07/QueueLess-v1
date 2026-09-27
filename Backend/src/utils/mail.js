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
export { generateOTP, getOtpHtml , otpHashing };