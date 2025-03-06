import express from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Error fetching courses: " + err.message });
  }
});

// ✅ Get a course by MongoDB `_id`
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📥 Received course ID from frontend:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format!");
      return res.status(400).json({ error: "Invalid course ID format" });
    }

    const course = await Course.findById(id);
    if (!course) {
      console.log("❌ Course not found in database!");
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("✅ Course found:", course);
    res.json(course);
  } catch (err) {
    console.error("❌ Error fetching course:", err.message);
    res.status(500).json({ error: "Error fetching course: " + err.message });
  }
});

// ✅ Get a course by `courseCode` (Non-ObjectId field)
router.get("/course/:courseCode", async (req, res) => {
  try {
    const { courseCode } = req.params;
    console.log("📥 Received courseCode:", courseCode);

    const course = await Course.findOne({ courseCode });

    if (!course) {
      console.log("❌ Course not found!");
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("✅ Course found:", course);
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Error fetching course: " + err.message });
  }
});

// ✅ NEW ENDPOINT: Get courses by professor name
router.get("/professor/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log("📥 Searching for courses by professor:", name);

    // Using regex for case-insensitive partial matching
    const courses = await Course.find({ 
      professor: { $regex: name, $options: "i" } 
    });

    console.log(`✅ Found ${courses.length} courses for professor ${name}`);
    res.json(courses);
  } catch (err) {
    console.error("❌ Error fetching courses by professor:", err.message);
    res.status(500).json({ error: "Error fetching courses: " + err.message });
  }
});

// ✅ Enroll a user in a course using `_id`
router.post("/user/:userId/enroll", async (req, res) => {
  try {
    const { id } = req.body; // Course ID
    const userId = req.params.userId; // User ID

    console.log("📥 Enrollment request received:", { userId, courseId: id });

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(id);

    if (!user || !course) {
      console.log("❌ User or course not found!");
      return res.status(404).json({ error: "User or course not found" });
    }

    if (user.enrolledCourses.includes(id)) {
      console.log("⚠️ User already enrolled in this course:", id);
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // ✅ Add course to user's enrolledCourses
    user.enrolledCourses.push(id);
    await user.save();

    // ✅ Add user to course's users array
    course.users.push(userId);
    await course.save();

    console.log("✅ Enrollment successful:", { user: userId, course: id });
    res.json({ message: "✅ Enrollment successful", enrolledCourses: user.enrolledCourses });
  } catch (err) {
    console.error("❌ Error enrolling in course:", err.message);
    res.status(500).json({ error: "Error enrolling in course: " + err.message });
  }
});

// ✅ Get all enrolled courses for a user
router.get("/user/:userId/enrolled", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Enrolled courses retrieved for user:", req.params.userId);
    res.json(user.enrolledCourses);
  } catch (err) {
    console.error("❌ Error fetching enrolled courses:", err.message);
    res.status(500).json({ error: "Error fetching enrolled courses: " + err.message });
  }
});

// ✅ Remove a user from a course using `_id`
router.post("/user/:userId/remove", async (req, res) => {
  try {
    const { id } = req.body; // Course ID
    const userId = req.params.userId; // User ID

    console.log("📥 Course removal request:", { userId, courseId: id });

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(id);

    if (!user || !course) {
      return res.status(404).json({ error: "User or course not found" });
    }

    // ✅ Remove course from user's enrolledCourses
    user.enrolledCourses = user.enrolledCourses.filter(courseId => courseId.toString() !== id);
    await user.save();

    // ✅ Remove user from course's users array
    course.users = course.users.filter(userIdEntry => userIdEntry.toString() !== userId);
    await course.save();

    console.log("✅ Course removed successfully:", { user: userId, course: id });
    res.json({ message: "✅ Course removed", enrolledCourses: user.enrolledCourses });
  } catch (err) {
    console.error("❌ Error removing course:", err.message);
    res.status(500).json({ error: "Error removing course: " + err.message });
  }
});

export default router;