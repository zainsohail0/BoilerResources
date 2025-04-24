import mongoose from "mongoose";
import resourceSchema from "./schemas/resourceSchema.js";
import voteSchema from "./schemas/voteSchema.js";
import commentSchema from "./schemas/commentSchema.js";
import commentVoteSchema from "./schemas/commentVoteSchema.js"; // Add this import

import Course from "./Course.js";
import Resource from "./Resource.js";
import User from "./User.js";
import Comment from "./Comment.js";
import CommentVote from "./CommentVote.js";

// Resource Model
export const ResourceModel = 
  mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

// Vote Model
export const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);

// Comment Model
export const CommentModel =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

// Comment Vote Model
export const CommentVoteModel = 
  mongoose.models.CommentVote || mongoose.model("CommentVote", commentVoteSchema);

export { Resource, Course, User, Comment, CommentVote }; // Add CommentVote to exports