import mongoose from "mongoose";
import resourceSchema from "./schemas/resourceSchema.js";
import voteSchema from "./schemas/voteSchema.js";
import commentSchema from "./schemas/commentSchema.js";
import { Course as CourseModel } from "./Course.js";

// Resource Model
export const Resource =
  mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

// Vote Model
export const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);

// Comment Model
export const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

// Course Model
export const Course = CourseModel;
