import { Resource, Comment, Course } from "../models/index.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import mongoose from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "course-resources",
    allowed_formats: [
      "jpg",
      "png",
      "gif",
      "doc",
      "docx",
      "pdf",
      "ppt",
      "pptx",
      "mp3",
      "wav",
      "mp4",
      "mov",
    ],
    resource_type: "auto",
  },
});

// Create multer upload middleware
export const upload = multer({ storage: storage });

// Get all resources for a course
export const getCourseResources = async (req, res) => {
  try {
    console.log("\n=== GET COURSE RESOURCES ===");
    const { courseId } = req.params;

    console.log("Request details:", {
      params: req.params,
      courseId: courseId,
      userId: req.user?._id,
    });

    if (!courseId) {
      console.log("No courseId provided");
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid courseId format:", courseId);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Convert courseId to ObjectId for comparison
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // First, verify the course exists
    const course = await Course.findById(courseObjectId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Finding resources for course:", courseObjectId.toString());

    // Find resources with explicit courseId match
    const resources = await Resource.find({
      courseId: courseObjectId,
    })
      .populate("postedBy", "username")
      .sort("-datePosted");

    // Log all resources in the database for debugging
    const allResources = await Resource.find({}).select("_id title courseId");
    console.log("All resources in database:", {
      count: allResources.length,
      resources: allResources.map((r) => ({
        _id: r._id,
        title: r.title,
        courseId: r.courseId?.toString(),
      })),
    });

    // Try an alternative query to double-check
    const altResources = await Resource.find({
      courseId: { $eq: courseObjectId },
    });

    console.log("Found resources for this course:", {
      count: resources.length,
      altQueryCount: altResources.length,
      courseName: course.title,
      courseId: courseObjectId.toString(),
      resources: resources.map((r) => ({
        _id: r._id,
        title: r.title,
        courseId: r.courseId?.toString(),
        postedBy: r.postedBy?.username,
        url: r.url,
        type: r.type,
      })),
    });

    // Send just the resources array as the frontend expects
    res.json(resources);
  } catch (error) {
    console.error("Error in getCourseResources:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message });
  }
};

// Upload a new resource
export const uploadResource = async (req, res) => {
  try {
    console.log("\n=== UPLOAD RESOURCE ===");

    // Check if file was uploaded
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({
        message: "No file uploaded",
        success: false,
      });
    }

    // Get courseId from URL params
    const courseId = req.params.courseId;
    if (!courseId) {
      console.log("No courseId provided");
      return res.status(400).json({
        message: "Course ID is required",
        success: false,
      });
    }

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid courseId format:", courseId);
      return res.status(400).json({
        message: "Invalid course ID format",
        success: false,
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({
        message: "Course not found",
        success: false,
      });
    }

    // Get user ID from request
    if (!req.user?._id) {
      console.log("No user found in request");
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    const { title, description } = req.body;
    const fileType = "." + req.file.originalname.split(".").pop().toLowerCase();

    // Determine resource type based on file type
    let resourceType = "other";
    if ([".jpg", ".png", ".gif"].includes(fileType)) {
      resourceType = "document";
    } else if ([".pdf"].includes(fileType)) {
      resourceType = "pdf";
    } else if ([".mp4", ".mov"].includes(fileType)) {
      resourceType = "video";
    } else if ([".doc", ".docx", ".ppt", ".pptx"].includes(fileType)) {
      resourceType = "document";
    }

    // Create resource with Cloudinary URL
    const resource = new Resource({
      title,
      description,
      type: resourceType,
      url: req.file.path, // Use Cloudinary URL
      fileType,
      courseId: course._id, // Use course's _id
      postedBy: req.user._id,
      datePosted: new Date(),
      upvotes: 0,
      downvotes: 0,
      comments: [],
    });

    // Save resource
    const savedResource = await resource.save();
    if (!savedResource) {
      throw new Error("Failed to save resource");
    }

    // Update course's resources array - only store the resource ID
    await Course.findByIdAndUpdate(
      courseId,
      { $push: { resources: savedResource._id } },
      { new: true }
    );

    // Get final resource with populated fields
    const finalResource = await Resource.findById(savedResource._id).populate(
      "postedBy",
      "username"
    );

    res.status(201).json({
      message: "Resource uploaded successfully",
      success: true,
      resource: finalResource,
    });
  } catch (error) {
    console.error("Error in uploadResource:", error);
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Delete a resource
export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if user is authorized to delete
    if (resource.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete from Cloudinary
    const publicId = resource.url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);

    // Delete from database
    await resource.remove();
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a resource
export const updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { title, description } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    resource.title = title || resource.title;
    resource.description = description || resource.description;

    const updatedResource = await resource.save();
    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vote on a resource
export const vote = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { voteType } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const result =
      voteType === "upvote"
        ? await resource.upvote(req.user)
        : await resource.downvote(req.user);

    if (!result) {
      return res.status(400).json({ message: "Already voted" });
    }

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment to a resource
export const addComment = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { content } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      resource: resourceId,
    });

    await resource.addComment(comment);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Test function to create a hard-coded resource
export const createTestResource = async (req, res) => {
  try {
    console.log("\n=== CREATING TEST RESOURCE ===");

    // Validate courseId
    const courseId = req.params.courseId;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid courseId:", courseId);
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Found course:", {
      _id: course._id,
      title: course.title,
    });

    // Create test resource
    const testResource = new Resource({
      title: "Test Resource",
      description: "This is a test resource",
      type: "document",
      url: "https://example.com/test.pdf",
      fileType: ".pdf",
      courseId: course._id, // Use the course's _id
      postedBy: req.user._id,
      datePosted: new Date(),
      upvotes: 0,
      downvotes: 0,
      comments: [],
    });

    // Log before saving
    console.log("Test resource before save:", {
      title: testResource.title,
      courseId: testResource.courseId.toString(),
      postedBy: testResource.postedBy.toString(),
    });

    // Save to MongoDB
    const savedResource = await testResource.save();

    if (!savedResource) {
      throw new Error("Failed to save test resource");
    }

    // Verify the save
    console.log("Test resource saved:", {
      _id: savedResource._id,
      title: savedResource.title,
      courseId: savedResource.courseId.toString(),
    });

    // Add to course's resources array
    course.resources.push(savedResource._id);
    await course.save();

    // Verify course update
    const updatedCourse = await Course.findById(courseId);
    console.log("Course resources after update:", {
      courseId: updatedCourse._id,
      resourceCount: updatedCourse.resources.length,
      lastResource:
        updatedCourse.resources[updatedCourse.resources.length - 1]?.toString(),
    });

    res.status(201).json(savedResource);
  } catch (error) {
    console.error("Error creating test resource:", error);
    res.status(500).json({ message: error.message });
  }
};
