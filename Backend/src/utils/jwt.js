import jwt from "jsonwebtoken";
import config from "../config/env.js";
import crypto from "crypto";

const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        config.accessTokenSecret,
        {
            expiresIn: "10m"
        }
    );
};

const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        config.refreshTokenSecret,
        {
            expiresIn: "7d"
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        config.accessTokenSecret
    );
};

const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        config.refreshTokenSecret
    );
};

const hashedToken = (refreshToken) => {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
};

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashedToken
};