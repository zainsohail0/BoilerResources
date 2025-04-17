import mongoose from "mongoose";
import voteSchema from "./schemas/voteSchema.js";

const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);

export default Vote;
