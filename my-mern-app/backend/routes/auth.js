import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport"; 
import User from "../models/User.js"; 
import "../config/passport.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config(); // Load environment variables

// Modify the signup route to include verification
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? "Email already registered" : "Username already taken",
      });
    }

    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with verified set to false
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      verified: false  // Add this field
    });

    await newUser.save();

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your BoileResources Account',
      text: `Click the following link to verify your account: http://localhost:3000/verify-email/${newUser._id}/${verificationToken}`,
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with BoileResources!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="http://localhost:3000/verify-email/${newUser._id}/${verificationToken}">
          Verify Your Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    // Send the verification email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ message: "Failed to send verification email", error: error.message });
      } else {
        console.log("Verification email sent:", info.response);
        return res.status(201).json({
          message: "User created successfully. Please check your email to verify your account.",
          user: { id: newUser._id, username: newUser.username, email: newUser.email },
          requiresVerification: true
        });
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

// Add a new route for email verification
router.get("/verify-email/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  try {
    // Find user first to confirm they exist
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is for the correct user
      if (decoded.id !== id) {
        return res.status(401).json({ message: "Token does not match user" });
      }

      // Update user to verified
      user.verified = true;
      await user.save();

      // Redirect to a frontend success page
      return res.redirect("http://localhost:3000/login?verified=true");
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Modify the login route to check for verification
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
    // Check if the user is verified
    if (!user.verified) {
      return res.status(401).json({ 
        message: "Please verify your email before logging in",
        requiresVerification: true,
        userId: user._id
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a route to resend verification email
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your BoileResources Account',
      text: `Click the following link to verify your account: http://localhost:3000/verify-email/${user._id}/${verificationToken}`,
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering with BoileResources!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="http://localhost:3000/verify-email/${user._id}/${verificationToken}">
          Verify Your Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    // Send the verification email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ message: "Failed to send verification email", error: error.message });
      } else {
        console.log("Verification email sent:", info.response);
        return res.status(200).json({
          message: "Verification email sent. Please check your inbox."
        });
      }
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Google OAuth Login (Redirects to Google)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth Callback (Handles Redirect after Google Login)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Generate JWT token for the authenticated user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Redirect user to frontend with the JWT token
    res.redirect(`http://localhost:3000/oauth-callback?token=${token}`);
  }
);

// Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });

    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clear session cookie
      res.redirect("http://localhost:3000"); // Redirect user to home
    });
  });
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // If user not found, send error message
    if (!user) {
      return res.status(404).json({ Status: "User not found" });
    }

    // Generate a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email configuration
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password Link',
      text: `Click the following link to reset your password: http://localhost:3000/reset-password/${user._id}/${token}`,
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your BoileResources account.</p>
        <p>Click the link below to set a new password:</p>
        <a href="http://localhost:3000/reset-password/${user._id}/${token}">
          Reset Your Password
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log("Email error:", error);
        return res.status(500).json({ Status: "Failed to send email", error: error.message });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ Status: "Success" });
      }
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ Status: "Server error", error: err.message });
  }
});

// Reset Password Route
router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ Status: "New password is required" });
  }

  try {
    // Find user first to confirm they exist
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ Status: "User not found" });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is for the correct user
      if (decoded.id !== id) {
        return res.status(401).json({ Status: "Token does not match user" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      // Update the user's password
      user.password = hash;
      await user.save();

      return res.status(200).json({ Status: "Password updated successfully" });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ Status: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ Status: "Server error", error: err.message });
  }
});

export default router;
