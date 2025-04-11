import express from "express";
import {
  toggleBookmark,
  getUserBookmarks,
  checkBookmarkStatus,
} from "../controllers/bookmarkController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Toggle bookmark for a resource
router.post("/resource/:resourceId", toggleBookmark);

// Get all bookmarks for the current user
router.get("/user", getUserBookmarks);

// Check if a resource is bookmarked by the current user
router.get("/resource/:resourceId/status", checkBookmarkStatus);

export default router;
