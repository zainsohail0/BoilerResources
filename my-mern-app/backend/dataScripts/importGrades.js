import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import { fileURLToPath } from "url";

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("MONGODB_URI loaded:", process.env.MONGODB_URI);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// GPA conversion map
const gradeToGPA = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, "D-": 0.7,
  F: 0.0,
};

// GPA calculator
const calculateAvgGPA = (grades) => {
  let total = 0;
  let count = 0;
  for (const [grade, pct] of Object.entries(grades)) {
    if (gradeToGPA[grade] !== undefined && pct) {
      total += gradeToGPA[grade] * parseFloat(pct);
      count += parseFloat(pct);
    }
  }
  return count > 0 ? (total / count).toFixed(2) : null;
};

// Grade distribution schema
const gradeDistributionSchema = new mongoose.Schema({
  subjectCode: String,
  courseCode: String,
  title: String,
  academicPeriod: String,
  section: String,
  crn: Number,
  instructor: String,
  grades: {
    A: Number, "A-": Number, "A+": Number, AU: Number, B: Number, "B-": Number, "B+": Number,
    C: Number, "C-": Number, "C+": Number, D: Number, "D-": Number, "D+": Number,
    E: Number, F: Number, I: Number, N: Number, P: Number, PI: Number,
    S: Number, SI: Number, U: Number, W: Number,
  },
  avgGrade: String,
});

const GradeDistribution = mongoose.model("GradeDistribution", gradeDistributionSchema);

// Main import function
const importGradeDistributions = async () => {
  try {
    await connectDB();

    const filePath = path.join(__dirname, "grades.xlsx");
    console.log(`Reading grade data from: ${filePath}`);

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Skip top 8 rows, start at row 9 (index 8)
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "", range: 8 });

    if (!data.length) {
      console.warn("No data found in Excel file.");
      return;
    }

    console.log("\nAvailable headers in first data row:");
    for (const key of Object.keys(data[0])) {
      console.log(`- "${key}"`);
    }

    console.log("\nFirst data row preview:");
    console.log(data[0]);

    const gradeKeys = [
      "A", "A-", "A+", "AU", "B", "B-", "B+", "C", "C-", "C+",
      "D", "D-", "D+", "E", "F", "I", "N", "P", "PI", "S", "SI", "U", "W"
    ];

    const docs = [];

    for (const row of data) {
      const crnRaw = row["CRN"];
      const crn = parseInt(crnRaw);

      if (!crnRaw || isNaN(crn)) {
        console.warn(`Skipping row - invalid CRN: "${crnRaw}" for course "${row["Title"]}"`);
        continue;
      }

      const grades = {};
      for (const key of gradeKeys) {
        grades[key] = row[key] ? parseFloat(row[key]) : 0;
      }

      const doc = new GradeDistribution({
        subjectCode: row["Subject"]?.trim(),
        courseCode: row["Course Number"]?.toString(),
        title: row["Title"]?.trim(),
        academicPeriod: row["Academic Period Desc"]?.trim(),
        section: row["Section"]?.toString(),
        crn,
        instructor: row["Instructor"]?.trim(),
        grades,
        avgGrade: calculateAvgGPA(grades),
      });

      console.log(`Parsed: ${doc.subjectCode} ${doc.courseCode} | Section ${doc.section} | CRN ${crn}`);
      docs.push(doc);
    }

    if (docs.length === 0) {
      console.warn("No valid grade distributions found to import.");
    } else {
      await GradeDistribution.insertMany(docs);
      console.log(`Successfully imported ${docs.length} grade distributions`);
    }
  } catch (err) {
    console.error("Error importing grade data:", err);
  } finally {
    mongoose.connection.close();
  }
};

importGradeDistributions();
