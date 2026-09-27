import config from "../config/env.js";
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: config.googleUser,
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        refreshToken: config.googleRefreshToken
    }
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error(error,'Error connecting to email server:');
  } else {
    logger.info('Email server is ready to send messages');
  }
});

export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"QueueLess" <${config.googleUser}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    logger.info('Message sent: %s', info.messageId);
    logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    logger.error(error,'Error sending email:');
  }
};