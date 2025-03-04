import express from "express";
import Class from "../models/Course.js"; // ✅ Ensure this matches your schema file
import User from "../models/User.js"; // ✅ Import User model

const router = express.Router();

// ✅ Get all classes
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: "Error fetching classes: " + err.message });
  }
});

// ✅ Get a class by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Class.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Class not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Error fetching class: " + err.message });
  }
});

// ✅ Add a new class
router.post("/", async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ error: "Error adding class: " + err.message });
  }
});

// ✅ Delete a class
router.delete("/:id", async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) return res.status(404).json({ error: "Class not found" });
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting class: " + err.message });
  }
});

// ========================= 👇 New Routes for Enrollment 👇 =========================

// ✅ Enroll a user in a class
router.post("/user/:userId/add", async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.params.userId);
    const classItem = await Class.findById(courseId);

    if (!user || !classItem) {
      return res.status(404).json({ error: "User or class not found" });
    }

    // Prevent duplicate enrollments
    if (user.enrolledClasses.includes(courseId)) {
      return res.status(400).json({ error: "Class already enrolled" });
    }

    user.enrolledClasses.push(courseId);
    await user.save();

    res.json({ message: "Class added successfully", enrolledClasses: user.enrolledClasses });
  } catch (err) {
    res.status(500).json({ error: "Error adding class: " + err.message });
  }
});

// ✅ Get all enrolled classes for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("enrolledClasses");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.enrolledClasses);
  } catch (err) {
    res.status(500).json({ error: "Error fetching enrolled classes: " + err.message });
  }
});

// ✅ Remove a user from a class
router.post("/user/:userId/remove", async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.enrolledClasses = user.enrolledClasses.filter((id) => id.toString() !== courseId);
    await user.save();

    res.json({ message: "Class removed successfully", enrolledClasses: user.enrolledClasses });
  } catch (err) {
    res.status(500).json({ error: "Error removing class: " + err.message });
  }
});

export default router;
