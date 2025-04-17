import mongoose from "mongoose";
import resourceSchema from "./schemas/resourceSchema.js";
import Vote from "./Vote.js";

// Methods from the diagram
resourceSchema.methods.getAttribute = function (name) {
  return this[name];
};

resourceSchema.methods.setAttribute = function (name, value) {
  this[name] = value;
  return this.save();
};

resourceSchema.methods.upvote = async function (user) {
  // Check if user has already voted
  const hasUpvoted = await Vote.findOne({
    user: user._id,
    resource: this._id,
    type: "upvote",
  });
  if (hasUpvoted) return false;

  // Remove any existing downvote
  await Vote.findOneAndDelete({
    user: user._id,
    resource: this._id,
    type: "downvote",
  });

  // Create new upvote
  await Vote.create({ user: user._id, resource: this._id, type: "upvote" });

  this.upvotes += 1;
  await this.save();
  return true;
};

resourceSchema.methods.downvote = async function (user) {
  // Check if user has already voted
  const hasDownvoted = await Vote.findOne({
    user: user._id,
    resource: this._id,
    type: "downvote",
  });
  if (hasDownvoted) return false;

  // Remove any existing upvote
  await Vote.findOneAndDelete({
    user: user._id,
    resource: this._id,
    type: "upvote",
  });

  // Create new downvote
  await Vote.create({ user: user._id, resource: this._id, type: "downvote" });

  this.downvotes += 1;
  await this.save();
  return true;
};

resourceSchema.methods.addComment = async function (commentId) {
  this.comments.push(commentId);
  await this.save();
};

resourceSchema.methods.generateShareLink = function () {
  this.shareLink = `${process.env.FRONTEND_URL}/resources/${this._id}`;
  return this.save();
};

const Resource =
  mongoose.models.Resource || mongoose.model("Resource", resourceSchema);

export default Resource;
