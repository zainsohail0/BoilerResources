import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";
import "../config/passport.js";

const router = express.Router();

// Function to send JWT in HTTP-only cookie
const sendTokenResponse = (user, res, rememberMe) => {

  const tokenExpiration = rememberMe ? "7d" : "1h"; //7 days if checked, 1 hour if not checked
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : null, // Persistent cookie if checked
  });

  res.json({
    message: "Authentication successful",
    user: { id: user._id, username: user.username, email: user.email },
  });
};

// Register User (Email & Password)
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? "Email already registered" : "Username already taken",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    sendTokenResponse(newUser, res);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

// Login User (Email & Password)
router.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    sendTokenResponse(user, res, rememberMe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user is authenticated (Session Persistence)
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.status(403).json({ message: "Invalid token" });
    }

    try {
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json(user);
    } catch (err) {
      console.error("MongoDB Error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
});

// Google OAuth Login (Redirects to Google)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth Callback (Handles Redirect after Google Login)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Generate a JWT token for Google users
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect("http://localhost:3000/home"); // Redirect to home after login
  }
);

// Logout Route (Clears Session & Cookie)
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // Clears JWT cookie
  res.clearCookie("connect.sid"); // Clears Google OAuth session

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout session destroy error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    console.log("Session destroyed, logout successful"); // Debug log
    res.json({ message: "Logout successful" }); // Returns JSON instead of redirecting
  });
});

export default router;
