import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
});

export default commentSchema;
