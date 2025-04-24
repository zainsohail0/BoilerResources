import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["report", "success", "info"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Set expiration to 2 days from now
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date;
      }
    }
  },
  { timestamps: true }
);

// Index for efficiently finding a user's notifications
notificationSchema.index({ userId: 1, read: 1 });

// Index for expiration (for TTL deletion)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;