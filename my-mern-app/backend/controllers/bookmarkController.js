import { Resource } from "../models/index.js";
import Bookmark from "../models/Bookmark.js";
import Course from "../models/Course.js";

// Toggle bookmark for a resource
export const toggleBookmark = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    // Find the resource to get its course
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if bookmark exists
    const existingBookmark = await Bookmark.findOne({
      user: userId,
      resource: resourceId,
    });

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return res.json({ message: "Bookmark removed", isBookmarked: false });
    } else {
      // Create new bookmark
      const newBookmark = new Bookmark({
        user: userId,
        resource: resourceId,
        course: resource.courseId,
      });
      await newBookmark.save();
      return res.json({ message: "Bookmark added", isBookmarked: true });
    }
  } catch (error) {
    console.error("Error in toggleBookmark:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bookmarks for a user
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate({
        path: "resource",
        select: "title url type description fileType",
      })
      .populate({
        path: "course",
        select: "title courseCode subjectCode",
      })
      .sort("-dateBookmarked");

    res.json(bookmarks);
  } catch (error) {
    console.error("Error in getUserBookmarks:", error);
    res.status(500).json({ message: error.message });
  }
};

// Check if a resource is bookmarked by the user
export const checkBookmarkStatus = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOne({
      user: userId,
      resource: resourceId,
    });

    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error("Error in checkBookmarkStatus:", error);
    res.status(500).json({ message: error.message });
  }
};
