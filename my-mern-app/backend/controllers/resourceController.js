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

    // Get courseId from URL params and convert to ObjectId immediately
    const courseId = req.params.courseId;
    console.log("Raw courseId from params:", courseId);

    if (!courseId) {
      console.log("No courseId provided in URL params");
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log("Invalid courseId format:", courseId);
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Convert courseId to ObjectId
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    console.log("Converted courseId to ObjectId:", courseObjectId);

    // First, verify the course exists
    const course = await Course.findById(courseObjectId);
    if (!course) {
      console.log("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Found course:", {
      _id: course._id,
      title: course.title,
      courseId: course._id.toString(),
    });

    if (!req.file) {
      console.log("No file provided");
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.user?._id) {
      console.log("No user found in request");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, description } = req.body;
    const fileType = "." + req.file.originalname.split(".").pop().toLowerCase();

    // Determine the resource type based on the file type
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

    // Create the resource data object with explicit courseId
    const resourceData = {
      title,
      description,
      type: resourceType,
      url: req.file.path,
      fileType,
      courseId: courseObjectId, // Set the courseId as ObjectId
      postedBy: req.user._id,
    };

    // Log the resource data before saving
    console.log("Creating resource with data:", {
      ...resourceData,
      courseId: resourceData.courseId.toString(),
      postedBy: resourceData.postedBy.toString(),
    });

    // Create and save the resource in one step
    const savedResource = await Resource.create(resourceData);

    if (!savedResource) {
      console.log("Failed to save resource");
      throw new Error("Resource failed to save");
    }

    // Verify the saved resource has the correct courseId
    console.log("Saved resource verification:", {
      _id: savedResource._id,
      title: savedResource.title,
      courseId: savedResource.courseId?.toString(),
      expectedCourseId: courseObjectId.toString(),
    });

    // Double check by fetching the resource from the database
    const verificationResource = await Resource.findById(
      savedResource._id
    ).select("_id courseId");
    console.log("Database verification:", {
      _id: verificationResource._id,
      courseId: verificationResource.courseId?.toString(),
      expectedCourseId: courseObjectId.toString(),
    });

    // Update the course's resources array
    const updatedCourse = await Course.findByIdAndUpdate(
      courseObjectId,
      {
        $addToSet: { resources: savedResource._id },
      },
      { new: true }
    );

    console.log("Updated course resources:", {
      courseId: updatedCourse._id.toString(),
      resourceCount: updatedCourse.resources.length,
      lastResource:
        updatedCourse.resources[updatedCourse.resources.length - 1]?.toString(),
    });

    // Get the final resource with populated fields
    const finalResource = await Resource.findById(savedResource._id).populate(
      "postedBy",
      "username"
    );

    if (!finalResource) {
      throw new Error("Failed to retrieve saved resource");
    }

    // Final verification log
    console.log("Final resource verification:", {
      _id: finalResource._id,
      title: finalResource.title,
      courseId: finalResource.courseId?.toString(),
      postedBy: finalResource.postedBy?.username,
    });

    res.status(201).json(finalResource);
  } catch (error) {
    console.error("Error in uploadResource:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: error.message });
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
