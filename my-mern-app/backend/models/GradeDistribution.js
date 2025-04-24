import mongoose from "mongoose";

const gradeDistributionSchema = new mongoose.Schema({
  subjectCode: String,
  courseCode: String,
  title: String,
  academicPeriod: String,
  section: String,
  crn: Number,
  instructor: String,
  grades: {
    A: Number, "A-": Number, "A+": Number, AU: Number,
    B: Number, "B-": Number, "B+": Number,
    C: Number, "C-": Number, "C+": Number,
    D: Number, "D-": Number, "D+": Number,
    E: Number, F: Number,
    I: Number, N: Number, P: Number, PI: Number,
    S: Number, SI: Number, U: Number, W: Number,
  },
  avgGrade: String, // stored as a string like "3.45" to match formatting
}, {
  timestamps: true
});

const GradeDistribution = mongoose.model("GradeDistribution", gradeDistributionSchema);

export default GradeDistribution;
