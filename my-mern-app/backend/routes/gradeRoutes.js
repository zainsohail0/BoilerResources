import express from "express";
import GradeDistribution from "../models/GradeDistribution.js"; // adjust path if needed

const router = express.Router();

// GET /api/grades/:subjectCode/:courseCode
router.get("/:subjectCode/:courseCode", async (req, res) => {
  const { subjectCode, courseCode } = req.params;

  try {
    const grades = await GradeDistribution.find({
      subjectCode: subjectCode.toUpperCase(),
      courseCode: courseCode,
    });

    if (!grades || grades.length === 0) {
      return res.status(404).json({ message: "No grade data found" });
    }

    res.json(grades);
  } catch (err) {
    console.error("Error fetching grade data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
