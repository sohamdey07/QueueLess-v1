import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";

import config from "../config/env.js";
import { redisClient } from "../config/redis.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    hashedToken} from "../utils/jwt.js";
import {generateOTP, getOtpHtml, getPasswordResetOtpHtml, getPasswordResetEmailHtml } from "../utils/mail.js";
import {hashPassword,comparePassword} from "../utils/password.js";
import {successResponse,errorResponse} from "../utils/apiResponse.js";

import {sendEmail} from "../services/mail.service.js";
import {
    storeOTP,
    verifyOTP,
    storePasswordResetOTP,
    verifyPasswordResetOTP,
    createPasswordResetToken,
    getPasswordResetTokenEmail,
    deletePasswordResetToken
} from "../services/otp.service.js";


//Register a new user
export async function registerUser(req,res,next){
    try{
        const {name,email,password} = req.body;

        //check if user already exists
        const existingUser = await userModel.findOne({email});
        
        if(existingUser){
            return errorResponse(res,{
                statusCode:400,
                message:"User already exists with this email"
            });
        }
        //hash the password
        const hashedPassword = await hashPassword(password);

        //create new user
        const newUser = await userModel.create({
            name,
            email,
            password:hashedPassword
        });

        //send email with otp
        const otp = generateOTP();

        //send email to user with otp
        await sendEmail(
            newUser.email,
            "Verify your email",
            `Your OTP code is ${otp}. It is valid for a limited time. Please do not share it with anyone.`,
            getOtpHtml(otp)
        );

        //store otp in redis
        await storeOTP(newUser.email, otp);

        return successResponse(res,
            {
                statusCode:201,
                message:"OTP sent successfully. Please verify your email to complete registration.",
                data:{
                    userId:newUser._id,
                    name:newUser.name,
                    email:newUser.email,
                    isVerified:newUser.isVerified,
                }
            }
        );
    }
    catch(err){
        next(err);
    }
}   

//verify account
export async function verifyAccount(req,res,next){
    try{
        const {email,otp} = req.body;

        //check if user exists
        const user = await userModel.findOne({email});

        if(!user){
            return errorResponse(res,{
                statusCode:404,
                message:"User not found"
            });
        }

        if(user.isVerified){
            return errorResponse(res,{
                statusCode:400,
                message:"Account already verified"
            });
        }
        
        //verify otp
        const isOtpValid = await verifyOTP(email, otp);

        if(!isOtpValid){
            return errorResponse(res,{
                statusCode:400,
                message:"Invalid or expired OTP"
            });
        }

        //update user as verified
        user.isVerified = true;

        await user.save();

        return successResponse(res,
            {
                statusCode:200,
                message:"Account verified successfully",
                data:{
                    userId:user._id,
                    name:user.name,
                    email:user.email,
                    isVerified:user.isVerified,
                }
            }
        );
    }
    catch(err){
        next(err);
    }
}

//login function
export async function login(req,res,next){
    try{
        const {email,password} = req.body;

        //check if user exists
        const user = await userModel.findOne({email});

        if(!user){
            return errorResponse(res,{
                statusCode:404,
                message:"User not found"
            });
        }

        if(!user.isVerified){
            return errorResponse(res,{
                statusCode:401,
                message:"Account not verified. Please verify your account before logging in."
            });
        }

        //compare password
        const isPasswordValid = await comparePassword(password, user.password);

        if(!isPasswordValid){
            return errorResponse(res,{
                statusCode:401,
                message:"Invalid password"
            });
        }

        //create refresh token and access token
        const refreshToken = generateRefreshToken({id:user._id, email:user.email});

        const hashedRefreshToken = hashedToken(refreshToken);

        //create a new session
        const newSession = await sessionModel.create({
            userId:user._id,
            refreshTokenHash:hashedRefreshToken,
            userAgent:req.headers['user-agent'],
            ipAddress:req.ip
        });

        const accessToken = generateAccessToken({id:user._id, role:user.role,sessionId:newSession._id});

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return successResponse(res,{
            statusCode:200,
            message:"Login successful",
            data:{
                userId:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                accessToken:accessToken
            }
        });
    }
    catch(err){
        next(err);
    }
}

//logout function
export async function logout(req,res,next){
    try{
        const {refreshToken} = req.cookies;

        if(!refreshToken){
            return errorResponse(res,{
                statusCode:401,
                message:"No refresh token found, user is not logged in"
            });
        }

        const hashedRefreshToken = hashedToken(refreshToken);

        //revoke the session
        const session = await sessionModel.findOne({refreshTokenHash:hashedRefreshToken});

        if(!session){
            return errorResponse(res,{
                statusCode:401,
                message:"Invalid refresh token, user is not logged in"
            });
        }
        session.revoke = true;
        await session.save();

        //delete the refresh token cookie
        const isProduction = process.env.NODE_ENV === "production";
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax"
        });

        return successResponse(res,{
            statusCode:200,
            message:"Logout successful"
        });
    }
    catch(err){
        next(err);
    }
}

//rotate refresh and access token function
export async function rotateToken(req,res,next){
    try{
        const {refreshToken} = req.cookies;

        if(!refreshToken){
            return errorResponse(res,{
                statusCode:401,
                message:"No refresh token found, user is not logged in"
            });
        }

        const hashedRefreshToken = hashedToken(refreshToken);

        //find the session
        const session = await sessionModel.findOne({refreshTokenHash:hashedRefreshToken});

        if(!session || session.revoke){
            return errorResponse(res,{
                statusCode:401,
                message:"Invalid refresh token, user is not logged in"
            });
        }

        //verify the refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if(!decoded){
            return errorResponse(res,{
                statusCode:401,
                message:"Invalid refresh token, user is not logged in"
            });
        }

        const user = await userModel.findById(session.userId).select("name email role");

        if(!user){
            return errorResponse(res,{
                statusCode:401,
                message:"Invalid refresh token, user is not logged in"
            });
        }

        //generate new refresh token
        const newRefreshToken = generateRefreshToken({id:decoded.id, email:decoded.email});

        const newHashedRefreshToken = hashedToken(newRefreshToken);

        //update the session with new refresh token
        session.refreshTokenHash = newHashedRefreshToken;
        await session.save();

        //generate new access token
        const accessToken = generateAccessToken({id:decoded.id, role:user.role, sessionId:session._id});

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return successResponse(res,{
            statusCode:200,
            message:"Token rotated successfully",
            data:{
                accessToken:accessToken,
                userId:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        });

    }
    catch(err){
        next(err);
    }
}


// Forgot Password: generate & send both modern reset link and fallback OTP via Redis
export async function forgotPasswordController(req, res, next) {
    try {
        const { email } = req.body;
        const normalizedEmail = email ? email.trim().toLowerCase() : "";

        // Check whether account exists and is active/verified
        const user = await userModel.findOne({ email: normalizedEmail });

        if (user && user.isVerified && user.isActive !== false) {
            const otp = generateOTP();

            // Store OTP in Redis with dedicated keys (ql:otp:password-reset:<email>, 5-min expiry)
            const storeResult = await storePasswordResetOTP(normalizedEmail, otp);

            // Generate temporary password-reset token (15-min expiry) for direct link
            const resetToken = await createPasswordResetToken(normalizedEmail);
            const clientUrl = (config.clientUrl || "http://localhost:5173").replace(/\/+$/, "");
            const resetUrl = `${clientUrl}/#/reset-password/${resetToken}`;

            // If not blocked by resend cooldown, send password reset link email
            if (storeResult.success) {
                await sendEmail(
                    user.email,
                    "Password Reset Request - QueueLess",
                    `Reset your password: ${resetUrl}`,
                    getPasswordResetEmailHtml({ resetUrl })
                );
            }
        }

        // Generic security response to prevent email enumeration
        return successResponse(res, {
            statusCode: 200,
            message: "If an account exists with this email, a password reset link has been sent."
        });
    } catch (err) {
        next(err);
    }
}

// Verify Reset Link: validates temporary reset token stored in Redis
export async function verifyResetLinkController(req, res, next) {
    try {
        const token = req.body.token || req.body.resetToken;

        if (!token) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Password reset authorization token is required."
            });
        }

        const email = await getPasswordResetTokenEmail(token);

        if (!email) {
            return errorResponse(res, {
                statusCode: 400,
                message: "This password reset link is invalid or has expired. Please request a new one."
            });
        }

        return successResponse(res, {
            statusCode: 200,
            message: "Password reset link is valid.",
            data: {
                valid: true,
                email,
                resetToken: token
            }
        });
    } catch (err) {
        next(err);
    }
}

// Verify Reset OTP: validates against Redis, returns short-lived reset authorization token
export async function verifyResetOtpController(req, res, next) {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = email ? email.trim().toLowerCase() : "";

        const verifyResult = await verifyPasswordResetOTP(normalizedEmail, otp);

        if (!verifyResult || !verifyResult.success) {
            let message = "Invalid or expired OTP code.";
            if (verifyResult?.reason === "MAX_ATTEMPTS") {
                message = "Maximum verification attempts exceeded. Please request a new OTP.";
            } else if (verifyResult?.reason === "OTP_EXPIRED") {
                message = "OTP has expired. Please request a new one.";
            } else if (verifyResult?.attemptsLeft !== undefined) {
                message = `Invalid OTP code. ${verifyResult.attemptsLeft} attempt(s) remaining.`;
            }

            return errorResponse(res, {
                statusCode: 400,
                message
            });
        }

        // Create temporary reset authorization token (10-15 min expiry)
        const resetToken = await createPasswordResetToken(normalizedEmail);

        return successResponse(res, {
            statusCode: 200,
            message: "OTP verified successfully",
            data: {
                resetToken
            }
        });
    } catch (err) {
        next(err);
    }
}

// Reset Password: validates reset token against Redis, updates user password, revokes sessions
export async function resetPasswordController(req, res, next) {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Password reset authorization token is required."
            });
        }

        // Validate reset token against Redis
        const email = await getPasswordResetTokenEmail(resetToken);

        if (!email) {
            return errorResponse(res, {
                statusCode: 400,
                message: "Invalid or expired password reset token. Please request a new OTP."
            });
        }

        // Retrieve the associated user
        const user = await userModel.findOne({ email });

        if (!user) {
            return errorResponse(res, {
                statusCode: 404,
                message: "User account not found."
            });
        }

        // Hash new password using existing password utility
        const hashedPassword = await hashPassword(newPassword);

        // Update password in database
        user.password = hashedPassword;
        await user.save();

        // Revoke all existing active sessions / refresh tokens for that user
        await sessionModel.updateMany(
            { userId: user._id, revoke: false },
            { revoke: true }
        );

        // Delete Redis reset token so it cannot be reused
        await deletePasswordResetToken(resetToken, email);

        // Delete any remaining OTP keys for this user
        await redisClient.del(`ql:otp:password-reset:${email}`);
        await redisClient.del(`ql:otp:attempts:password-reset:${email}`);
        await redisClient.del(`ql:otp:cooldown:password-reset:${email}`);

        // Clear refresh token cookie if any exists
        const isProduction = process.env.NODE_ENV === "production";
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax"
        });

        return successResponse(res, {
            statusCode: 200,
            message: "Password reset successfully. Please login with your new password.",
            data: {
                success: true
            }
        });
    } catch (err) {
        next(err);
    }
}

// Aliases for convenience
export const forgotPassword = forgotPasswordController;
export const verifyResetLink = verifyResetLinkController;
export const verifyResetOtp = verifyResetOtpController;
export const resetPassword = resetPasswordController;




