import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["image", "document", "audio", "video"],
  },
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: [
      ".jpg",
      ".png",
      ".gif",
      ".doc",
      ".docx",
      ".pdf",
      ".ppt",
      ".pptx",
      ".mp3",
      ".wav",
      ".mp4",
      ".mov",
    ],
  },
  shareLink: {
    type: String,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
});

// Methods
resourceSchema.methods.getAttribute = function (name) {
  return this[name];
};

resourceSchema.methods.setAttribute = function (name, value) {
  this[name] = value;
  return this.save();
};

resourceSchema.methods.upvote = async function (user) {
  const Vote = mongoose.model("Vote");
  const hasUpvoted = await Vote.findOne({
    user: user._id,
    resource: this._id,
    type: "upvote",
  });
  if (hasUpvoted) return false;

  await Vote.findOneAndDelete({
    user: user._id,
    resource: this._id,
    type: "downvote",
  });
  await Vote.create({ user: user._id, resource: this._id, type: "upvote" });

  this.upvotes += 1;
  await this.save();
  return true;
};

resourceSchema.methods.downvote = async function (user) {
  const Vote = mongoose.model("Vote");
  const hasDownvoted = await Vote.findOne({
    user: user._id,
    resource: this._id,
    type: "downvote",
  });
  if (hasDownvoted) return false;

  await Vote.findOneAndDelete({
    user: user._id,
    resource: this._id,
    type: "upvote",
  });
  await Vote.create({ user: user._id, resource: this._id, type: "downvote" });

  this.downvotes += 1;
  await this.save();
  return true;
};

resourceSchema.methods.addComment = async function (comment) {
  this.comments.push(comment._id);
  await this.save();
  return true;
};

resourceSchema.methods.generateShareLink = function () {
  this.shareLink = `${process.env.FRONTEND_URL}/resources/${this._id}`;
  return this.save();
};

export default resourceSchema;
