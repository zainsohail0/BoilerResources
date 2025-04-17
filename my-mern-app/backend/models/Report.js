import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["harassment", "inappropriate", "spam", "hateSpeech", "violence", "other"],
    },
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    contentType: {
      type: String,
      required: true,
      enum: ["comment", "profile", "studyGroup", "resource", "message"],
    },
    contentId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actionTaken: {
      type: String,
      enum: ["none", "warning", "remove", "ban"],
    },
  },
  { timestamps: true }
);

// Add index for faster querying by status and severity
reportSchema.index({ status: 1, severity: -1, createdAt: -1 });

// Add special index for admin dashboard
reportSchema.index({ status: 1, category: 1, severity: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;