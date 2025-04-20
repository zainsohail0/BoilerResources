import express from "express";
import Report from "../models/Report.js";
//import { isAuthenticated } from "../routes/auth.js";
//import { isAuthenticated } from "jsonwebtoken";

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
router.patch("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { status, adminNotes, actionTaken } = req.body;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        actionTaken,
        resolvedBy: status === "resolved" ? req.user._id : undefined,
      },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // TODO: Send notification to the reporter when status changes

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
