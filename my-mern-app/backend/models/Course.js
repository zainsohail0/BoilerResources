import mongoose from "mongoose";
const { Schema } = mongoose;

// Comment Schema for Resources
const commentSchema = new Schema({
  text: { type: String, required: true, trim: true },
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  datePosted: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
});

// Resource Schema for Course Resources
const resourceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["pdf", "video", "link", "document", "other"],
    default: "other",
    required: true,
  },
  url: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  datePosted: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [commentSchema],
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Main Course Schema
const courseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subjectCode: { type: String, required: true, trim: true },
  courseCode: { type: String, required: true, trim: true },
  instructor: [{ type: String, required: true }], // Array of instructors
  description: { type: String, required: true, trim: true },
  capacity: { type: Number, default: 0 },
  credits: { type: Number, required: true }, // ✅ Changed to single Number instead of an array
  term: { type: String, required: true },
  crn: [{ type: Number, required: true, default: [] }], // ✅ Default empty array
  sched: [{ type: String, required: true, default: [] }], // ✅ Default empty array
  resources: [resourceSchema], // Embedded resources for each course
  users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // ✅ Tracks enrolled users
});

const Course = mongoose.model("Course", courseSchema);
const Resource = mongoose.model("Resource", resourceSchema);

export { Course, Resource };
export default Course;
