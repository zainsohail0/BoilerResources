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
import { router as messageRoutes } from "./routes/messages.js"; // ✅ Fix: Named import
import chatSocketHandler from "./chatSocket.js";
import "./config/passport.js"; // Ensure passport is configured

dotenv.config();

const app = express();
const server = createServer(app); // Create HTTP server for WebSockets

// ✅ CORS Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Express session for authentication
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

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 Server is running..." });
});

// ✅ Debugging Route (Check Session Data)
app.get("/debug-session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || "No user",
  });
});

// ✅ WebSocket Server Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Pass WebSocket server to chat handler
chatSocketHandler(io);

// ✅ Start Server with MongoDB Connection
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
