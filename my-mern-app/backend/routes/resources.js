import express from "express";
import { Course, Resource } from "../models/Course.js";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ... existing code ...

// Comment notification route
router.post("/notify", async (req, res) => {
  const {
    resourceOwnerEmail,
    resourceTitle,
    commentAuthor,
    commentText,
    resourceUrl,
    isReply,
    parentCommentAuthor,
  } = req.body;

  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare email subject and content based on whether it's a reply or new comment
    const subject = isReply
      ? `New reply to a comment on your resource: ${resourceTitle}`
      : `New comment on your resource: ${resourceTitle}`;

    const content = isReply
      ? `${commentAuthor} replied to ${parentCommentAuthor}'s comment on your resource "${resourceTitle}"`
      : `${commentAuthor} commented on your resource "${resourceTitle}"`;

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: resourceOwnerEmail,
      subject: subject,
      html: `
        <h1>${subject}</h1>
        <p>${content}</p>
        <p><strong>Comment:</strong> "${commentText}"</p>
        <p>View the resource here: <a href="${resourceUrl}">${resourceTitle}</a></p>
        <hr>
        <p><small>You are receiving this email because you are the owner of this resource.</small></p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error("Failed to send notification:", err);
    res
      .status(500)
      .json({ message: "Failed to send notification", error: err.message });
  }
});

export default router;
