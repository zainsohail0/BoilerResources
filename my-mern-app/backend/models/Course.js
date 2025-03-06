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

// Add resourceSchema methods from completed-classes branch
resourceSchema.methods.downvote = function(user) {
  // Check if user has already voted
  // Implement your voting logic here
  this.downvotes += 1;
  return true;
};

resourceSchema.methods.addComment = function(comment) {
  this.comments.push(comment);
  return true;
};

resourceSchema.methods.generateShareLink = function() {
  // Generate a unique share link
  this.shareLink = `${process.env.APP_URL}/resources/${this._id}`;
  return this.shareLink;
};

resourceSchema.methods.getAttribute = function(name) {
  // Return the attribute value based on the name
  return this[name];
};

resourceSchema.methods.setAttribute = function(name, value) {
  // Set the attribute value based on the name
  this[name] = value;
};

// Main Course Schema - Combined from both branches
const courseSchema = new Schema({
  courseId: {
    type: Number,
    unique: true
  },
  title: { type: String, required: true, trim: true },
  subjectCode: { type: String, trim: true },
  courseCode: { type: String, required: true, trim: true },
  instructor: [{ type: String }], // Array of instructors
  professor: { type: String, trim: true },
  professorEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  description: { type: String, required: true, trim: true },
  capacity: { type: Number, default: 0 },
  credits: { type: Number }, // Academic credits
  creditHours: { type: Number, min: 1 }, // Credit hours
  term: { type: String },
  crn: [{ type: Number, default: [] }],
  sched: [{ type: String, default: [] }],
  type: {
    type: String,
    enum: ['Lecture', 'Lab', 'Seminar', 'Workshop', 'Online'],
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  resources: [resourceSchema], // Embedded resources for each course
  users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }], // Tracks enrolled users
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Create models
const Course = mongoose.model("Course", courseSchema);
const Resource = mongoose.model("Resource", resourceSchema);

export { Course, Resource };
export default Course;