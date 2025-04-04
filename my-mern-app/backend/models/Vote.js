import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one vote per resource
voteSchema.index({ user: 1, resource: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
