import mongoose from "mongoose";

const commentVoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
    },
    type: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one vote per comment
commentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });

const CommentVote =
  mongoose.models.CommentVote ||
  mongoose.model("CommentVote", commentVoteSchema);

export default CommentVote;