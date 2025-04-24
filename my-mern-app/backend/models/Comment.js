import mongoose from "mongoose";
import CommentVote from "./CommentVote.js";

const commentSchema = new mongoose.Schema(
  {
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
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.methods.upvote = async function (user) {
  // Check if user has already upvoted
  const hasUpvoted = await CommentVote.findOne({
    user: user._id,
    comment: this._id,
    type: "upvote",
  });

  if (hasUpvoted) {
    // Remove upvote if already exists (toggle behavior)
    await CommentVote.findOneAndDelete({
      user: user._id,
      comment: this._id,
      type: "upvote",
    });
    this.upvotes = Math.max(0, this.upvotes - 1);
    await this.save();
    return { action: "removed", type: "upvote" };
  }

  // Remove any existing downvote
  const hasDownvoted = await CommentVote.findOne({
    user: user._id,
    comment: this._id,
    type: "downvote",
  });

  if (hasDownvoted) {
    await CommentVote.findOneAndDelete({
      user: user._id,
      comment: this._id,
      type: "downvote",
    });
    this.downvotes = Math.max(0, this.downvotes - 1);
  }

  // Create new upvote
  await CommentVote.create({
    user: user._id,
    comment: this._id,
    type: "upvote",
  });
  this.upvotes += 1;
  await this.save();
  return { action: "added", type: "upvote" };
};

commentSchema.methods.downvote = async function (user) {
  // Check if user has already downvoted
  const hasDownvoted = await CommentVote.findOne({
    user: user._id,
    comment: this._id,
    type: "downvote",
  });

  if (hasDownvoted) {
    // Remove downvote if already exists (toggle behavior)
    await CommentVote.findOneAndDelete({
      user: user._id,
      comment: this._id,
      type: "downvote",
    });
    this.downvotes = Math.max(0, this.downvotes - 1);
    await this.save();
    return { action: "removed", type: "downvote" };
  }

  // Remove any existing upvote
  const hasUpvoted = await CommentVote.findOne({
    user: user._id,
    comment: this._id,
    type: "upvote",
  });

  if (hasUpvoted) {
    await CommentVote.findOneAndDelete({
      user: user._id,
      comment: this._id,
      type: "upvote",
    });
    this.upvotes = Math.max(0, this.upvotes - 1);
  }

  // Create new downvote
  await CommentVote.create({
    user: user._id,
    comment: this._id,
    type: "downvote",
  });
  this.downvotes += 1;
  await this.save();
  return { action: "added", type: "downvote" };
};

// Virtual for replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
