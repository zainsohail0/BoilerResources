import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import "./config/passport.js";

dotenv.config();

const app = express();

// Add CORS Middleware
app.use(cors({
  origin: "http://localhost:3000", // Replace with your frontend URL
  credentials: true // Allow cookies and authentication headers
}));

//  Add Middleware for JSON Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session for Google OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbackSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set secure: true if using HTTPS
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);

// Start Server
const PORT = process.env.PORT || 5001;
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


