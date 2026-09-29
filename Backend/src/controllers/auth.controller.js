import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";

import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    hashedToken} from "../utils/jwt.js";
import {generateOTP, getOtpHtml } from "../utils/mail.js";
import {hashPassword,comparePassword} from "../utils/password.js";
import {successResponse,errorResponse} from "../utils/apiResponse.js";

import {sendEmail} from "../services/mail.service.js";
import { storeOTP,verifyOTP } from "../services/otp.service.js";


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
        await sendEmail(newUser.email, "Verify your email", getOtpHtml(otp));

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

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
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
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
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

        const user = await userModel.findById(session.userId).select("role");

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

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return successResponse(res,{
            statusCode:200,
            message:"Token rotated successfully",
            data:{
                accessToken:accessToken
            }
        });

    }
    catch(err){
        next(err);
    }
}


//forgot password function











//create refresh token and access token
        // const refreshToken = generateRefreshToken({id:newUser._id, email:newUser.email});

        // const hashedRefreshToken = hashedToken(refreshToken);

        // //create a new session
        // const newSession = await sessionModel.create({
        //     userId:newUser._id,
        //     refreshToken:hashedRefreshToken
        // });

        // const accessToken = generateAccessToken({id:newUser._id, email:newUser.email, sessionId:newSession._id});