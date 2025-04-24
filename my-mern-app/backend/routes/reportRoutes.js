import express from "express";
import Report from "../models/Report.js";
//import { isAuthenticated } from "../routes/auth.js";
//import { isAuthenticated } from "jsonwebtoken";
import Notification from "../models/Notification.js";

import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit a new report
router.post("/", protect, async (req, res) => {
  try {
    const { category, severity, contentType, contentId, description } =
      req.body;

    // Validate required fields
    if (!category || !contentType || !contentId || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create new report
    const newReport = new Report({
      reporterId: req.user._id,
      category,
      severity,
      contentType,
      contentId,
      description,
    });

    await newReport.save();

    // TODO: Send notification to admins (implement in a separate feature)

    const notification = new Notification({
      userId: req.user._id,
      title: "Report Submitted",
      message: "Thank you for your report. It has been received and will be reviewed by our team.",
      type: "report",
    });
    
    await notification.save();

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report: newReport,
    });
  } catch (err) {
    console.error("Error submitting report:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting report",
      error: err.message,
    });
  }
});

// Get all reports (admin only)
router.get("/", protect, async (req, res) => {
  try {
    const { status, category, severity, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Apply filters if provided
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort by severity (high to low) then by creation date (newest first)
    const reports = await Report.find(filter)
      .populate("reporterId", "username email")
      .populate("resolvedBy", "username email")
      .sort({
        // Sort by status (pending first)
        status: status === "pending" ? -1 : 1,
        // Then by severity (high to low)
        severity: -1,
        // Then by category with fixed priority
        category:
          category === "violence"
            ? -1
            : category === "hateSpeech"
            ? -2
            : category === "harassment"
            ? -3
            : 1,
        // Finally by creation date (newest first)
        createdAt: -1,
      })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
      error: err.message,
    });
  }
});

// Get a single report by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporterId", "username email")
      .populate("resolvedBy", "username email");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Only allow admins or the reporter to view the report
    if (
      !req.user.isAdmin &&
      report.reporterId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this report",
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("Error fetching report:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching report",
      error: err.message,
    });
  }
});

// Update report status (admin only)
// Update report status (removed isAdmin middleware)
router.patch("/:id", protect, async (req, res) => {
  try {
    const { status, adminNotes, actionTaken } = req.body;
    
    // Add validation for required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Find the report first to verify it exists
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes: adminNotes || '',
        actionTaken: actionTaken || 'none',
        resolvedBy: status === "resolved" ? req.user._id : undefined,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate("reporterId", "username email")
     .populate("resolvedBy", "username email");

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Add notification to the reporter when report status changes
    if (report.status !== status) {
      const notification = new Notification({
        userId: report.reporterId,
        title: `Report ${status === "resolved" ? "Resolved" : status === "dismissed" ? "Dismissed" : "Under Review"}`,
        message: `Your report has been ${status === "resolved" ? "resolved" : status === "dismissed" ? "dismissed" : "updated to under review"}.`,
        type: "info",
      });
      
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: updatedReport,
    });
  } catch (err) {
    console.error("Error updating report:", err);
    res.status(500).json({
      success: false,
      message: "Error updating report",
      error: err.message,
    });
  }
});

// Get user's submitted reports
router.get("/user/submitted", protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (err) {
    console.error("Error fetching user reports:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user reports",
      error: err.message,
    });
  }
});

export default router;
