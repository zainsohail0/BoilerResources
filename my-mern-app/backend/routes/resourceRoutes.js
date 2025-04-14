import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCourseResources,
  uploadResource,
  deleteResource,
  updateResource,
  vote,
  addComment,
  upload,
  createTestResource,
} from "../controllers/resourceController.js";

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

// Create a test resource
router.post("/:courseId/test", protect, createTestResource);

export default router;
