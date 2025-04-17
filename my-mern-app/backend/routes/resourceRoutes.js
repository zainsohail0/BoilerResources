import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCourseResources,
  uploadResource,
  deleteResource,
  updateResource,
  vote,
  upload,
  addComment,
  getComments,
  editComment,
  deleteComment,
  addReply,
} from "../controllers/resourceController.js";
import { Resource } from "../models/index.js";

const router = express.Router();

// Get all resources for a course
router.get("/course/:courseId", protect, getCourseResources);

// Upload a new resource
router.post(
  "/course/:courseId/upload",
  protect,
  upload.single("file"),
  uploadResource
);

// Delete a resource
router.delete("/:resourceId", protect, deleteResource);

// Update a resource
router.put("/:resourceId", protect, updateResource);

// Vote on a resource
router.post("/:resourceId/vote", protect, vote);

// Add a comment to a resource
router.post("/:resourceId/comments", protect, addComment);

// Get comments for a resource
router.get("/:resourceId/comments", protect, getComments);

// Edit a comment
router.put("/:resourceId/comments/:commentId", protect, editComment);

// Delete a comment
router.delete("/:resourceId/comments/:commentId", protect, deleteComment);

// Add a reply to a comment
router.post("/:resourceId/comments/:commentId/reply", protect, addReply);

export default router;
