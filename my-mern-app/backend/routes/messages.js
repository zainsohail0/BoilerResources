import express from "express";
import Message from "../models/Message.js"; // ✅ Ensure the correct path
import mongoose from "mongoose";

const router = express.Router();

// ✅ Get messages for a group (with pagination)
router.get("/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query; // Default pagination

  try {
    console.log("🔎 Fetching messages for groupId:", groupId);

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid groupId" });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 }) // ✅ Oldest messages first
      .skip((page - 1) * limit) // ✅ Pagination
      .limit(parseInt(limit))
      .exec();

    console.log("📩 Messages found:", messages);
    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Export the router as a named export, not default
export { router };
