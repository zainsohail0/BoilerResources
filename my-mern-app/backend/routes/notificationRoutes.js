import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  createNotification,
  markAllAsRead,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

// Get all notifications for current user
router.get("/", protect, getNotifications);

// Create a new notification
router.post("/", protect, createNotification);

// Mark all notifications as read
router.post("/read-all", protect, markAllAsRead);

// Clear all notifications
router.delete("/clear-all", protect, clearAllNotifications);

export default router;