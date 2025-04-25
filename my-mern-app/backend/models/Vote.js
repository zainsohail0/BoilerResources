// import mongoose from "mongoose";
// import voteSchema from "./schemas/voteSchema.js";

// const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);

// export default Vote;

import mongoose from "mongoose";
import voteSchema from "./schemas/voteSchema.js";

voteSchema.statics.castVote = async function (resourceId, userId, voteType) {
  const existingVote = await this.findOne({ resourceId, userId });

  // CASE 1: No vote yet – add it
  if (!existingVote) {
    await this.create({ resourceId, userId, voteType });
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

const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);
export default Vote;

