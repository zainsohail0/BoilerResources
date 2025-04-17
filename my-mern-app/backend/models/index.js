import mongoose from "mongoose";
import resourceSchema from "./schemas/resourceSchema.js";
import voteSchema from "./schemas/voteSchema.js";
import commentSchema from "./schemas/commentSchema.js";
import Course from "./Course.js";
import Resource from "./Resource.js";
import User from "./User.js";
import Comment from "./Comment.js";

// Resource Model
export const ResourceModel =
  mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

// Vote Model
export const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);

// Comment Model
export const CommentModel =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export { Resource, Course, User, Comment };
