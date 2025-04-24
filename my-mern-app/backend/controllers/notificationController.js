import Notification from "../models/Notification.js";
import mongoose from "mongoose";

// Get all notifications for the current user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ 
      userId,
      // Only include notifications that haven't expired
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 notifications
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    
    // Ensure the user has permission to create notifications for other users
    // For admin or system notifications
    if (userId && userId !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to create notifications for other users" });
    }
    
    const notification = new Notification({
      userId: userId || req.user._id,
      title,
      message,
      type: type || "info",
      read: false,
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Error marking notifications as read" });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await Notification.deleteMany({ userId });
    
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Error clearing notifications" });
  }
};