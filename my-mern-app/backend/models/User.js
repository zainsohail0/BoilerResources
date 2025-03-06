import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    googleid: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      default: "",
    },
    grade: {
      type: String,
      default: "",
    },
    major: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const User = mongoose.model("User", userSchema);

export default User;