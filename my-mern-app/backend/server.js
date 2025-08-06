import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import MongoStore from "connect-mongo";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/classRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import calendarRoutes from "./routes/calendar.js"; // Added
import messageRoutes from "./routes/messages.js"; // Added
import resourceRoutes from "./routes/resourceRoutes.js"; // Added resource routes
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
//import { router as messageRoutes } from "./routes/messages.js";
import gradeRoutes from "./routes/gradeRoutes.js"; // NEW


import exportCalendarRoutes from "./routes/googleCalendar.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import reportRoutes from "./routes/reportRoutes.js"; // Added report routes

import plannerRoutes from "./routes/planner.js"; // ✅ Added planner route
import chatSocketHandler from "./chatSocket.js";
import "./config/passport.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const server = createServer(app);

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbackSecretKey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/calendar/export", exportCalendarRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/planner", plannerRoutes); // Register planner routes

app.use("/api/resources", resourceRoutes); //  Added resource routes
app.use("/api/bookmarks", bookmarkRoutes);

app.use("/api/reports", reportRoutes); // Added report routes
app.use("/api/grades", gradeRoutes);
app.use("/api/notifications", notificationRoutes);



app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 Server is running..." });
});

app.get("/debug-session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || "No user",
  });
});

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

chatSocketHandler(io);

// Start Server
const PORT = process.env.PORT || 5001;

mongoose
  .set("debug", true)
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
