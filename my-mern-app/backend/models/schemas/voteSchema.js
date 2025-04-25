 // voteSchema.js - Modified version
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    // Change field names to match the database index
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  { timestamps: true }
);

// Create a compound index to prevent duplicate votes
voteSchema.index({ user: 1, resource: 1 }, { unique: true });

// Modified castVote static method to use the correct field names
voteSchema.statics.castVote = async function (resourceId, userId, voteType) {
  // Use the field names that match your database index (user and resource)
  const existingVote = await this.findOne({ 
    resource: resourceId, 
    user: userId 
  });

  // CASE 1: No vote yet – add it
  if (!existingVote) {
    await this.create({ 
      resource: resourceId, 
      user: userId, 
      voteType 
    });
    return { action: "added", voteType };
  }

  // CASE 2: Same vote again – remove it
  if (existingVote.voteType === voteType) {
    await this.deleteOne({ _id: existingVote._id });
    return { action: "removed", voteType };
  }

  // CASE 3: Switch vote (e.g., upvote → downvote)
  existingVote.voteType = voteType;
  await existingVote.save();
  return { action: "switched", voteType };
};

export default voteSchema;