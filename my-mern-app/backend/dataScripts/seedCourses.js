import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Course } from "../models/Course.js"; // Import the Course model

dotenv.config(); // Load environment variables

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Define valid course types in your schema
const validTypes = ["Lecture", "Lab", "Seminar", "Workshop", "Online"];

// Load JSON and insert into MongoDB
const addCoursesFromJSON = async () => {
  try {
    await connectDB(); // Ensure DB is connected

    const filePath = "./dataScripts/classes_spring2025.json"; // Ensure the file path is correct
    console.log(`📂 Looking for file at: ${filePath}`);

    const jsonData = fs.readFileSync(filePath, "utf-8");
    let courses = JSON.parse(jsonData);

    // Transform the JSON structure to match the Mongoose schema
    courses = courses.map((course) => ({
      courseId: course.crn[0], // Extract first CRN
      courseCode: `${course.subjectCode}${course.courseCode}`, // Combine subjectCode + courseCode
      title: course.title,
      professor: course.instructor ? course.instructor.join(", ") : "Unknown", // Join instructor array
      description: course.description && course.description.trim() !== "" ? course.description : "No description available.", // 🔥 Ensure description is not empty
      creditHours: course.credits[0] > 0 ? course.credits[0] : 1, // 🔥 Ensure creditHours is at least 1
      type: validTypes.includes(course.sched[0]) ? course.sched[0] : "Online", // 🔥 Map invalid types to "Online"
      subject: course.subjectCode,
      term: course.term,
      capacity: 250, // 🔥 Set capacity to 250 for all courses
    }));

    // Insert courses into MongoDB
    await Course.insertMany(courses);
    console.log("✅ Courses added successfully!");
  } catch (error) {
    console.error("❌ Error adding courses:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the function
addCoursesFromJSON();
