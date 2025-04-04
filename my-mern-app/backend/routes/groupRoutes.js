import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js"; // Make sure path is correct

const router = express.Router();

// Middleware to check authentication with detailed logging
// Super permissive authentication middleware for development
const isAuthenticated = (req, res, next) => {
  console.log("Authentication check attempt");

  // First try to get userId from custom headers (set by frontend)
  const userIdHeader = req.headers["x-user-id"];
  if (userIdHeader) {
    console.log("Found user ID in header:", userIdHeader);
    req.user = { _id: userIdHeader };
    return next();
  }

  // Then try admin ID for admin-specific routes
  const adminIdHeader = req.headers["x-admin-id"];
  if (adminIdHeader && req.originalUrl.includes("/join-requests")) {
    console.log("Found admin ID in header for join requests:", adminIdHeader);
    req.user = { _id: adminIdHeader };
    return next();
  }

  // Check for Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log("Found Authorization Bearer token");

    // In a real app, you'd verify the token here
    // For now, we'll just check for adminId or userId in the request

    // Extract userId from token or request body/params
    if (req.body && req.body.adminId) {
      req.user = { _id: req.body.adminId };
      console.log("Using adminId from request body:", req.user);
      return next();
    } else if (req.body && req.body.userId) {
      req.user = { _id: req.body.userId };
      console.log("Using userId from request body:", req.user);
      return next();
    } else if (req.params && req.params.userId) {
      req.user = { _id: req.params.userId };
      console.log("Using userId from params:", req.user);
      return next();
    } else if (req.query && req.query.adminId) {
      req.user = { _id: req.query.adminId };
      console.log("Using adminId from query:", req.user);
      return next();
    } else if (req.query && req.query.userId) {
      req.user = { _id: req.query.userId };
      console.log("Using userId from query:", req.user);
      return next();
    }
  }

  // Check standard passport authentication
  if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
    console.log("Authenticated via isAuthenticated()");
    return next();
  }

  if (req.user) {
    console.log("Authenticated via req.user");
    return next();
  }

  // Check session
  if (req.session && req.session.passport && req.session.passport.user) {
    console.log("Authenticated via passport session");
    req.user = req.session.passport.user;
    return next();
  }

  console.log("Regular authentication methods failed - attempting fallbacks");

  // Extra special handling for join requests route
  if (req.originalUrl.includes("/join-requests")) {
    console.log("Join requests route detected - checking for group ID");

    // Extract group ID from URL path
    const matches = req.originalUrl.match(/\/groups\/([^\/]+)\/join-requests/);
    if (matches && matches[1]) {
      const groupId = matches[1];
      console.log(`Extracted group ID: ${groupId}`);

      // If group ID is in the URL, try to find it and get admin ID
      try {
        const mongoose = require("mongoose");
        const Group = require("../models/Group.js");

        if (mongoose.Types.ObjectId.isValid(groupId)) {
          Group.findById(groupId)
            .then((group) => {
              if (group) {
                console.log(
                  `Found group ${groupId}, admin is ${group.adminId}`
                );
                req.user = { _id: group.adminId };
                return next();
              } else {
                console.log(`Group ${groupId} not found`);
                fallbackAuth(req, res, next);
              }
            })
            .catch((err) => {
              console.error(`Error finding group ${groupId}:`, err);
              fallbackAuth(req, res, next);
            });
          return; // Return here, next() will be called in the promise chain
        }
      } catch (err) {
        console.error("Error in group lookup:", err);
      }
    }
  }

  fallbackAuth(req, res, next);
};

const fallbackAuth = (req, res, next) => {
  // DEVELOPMENT ONLY: For group creation endpoint, auto-authenticate with adminId
  if (
    req.method === "POST" &&
    req.originalUrl.includes("/api/groups") &&
    req.body &&
    req.body.adminId
  ) {
    console.log(
      "DEVELOPMENT MODE: Bypassing authentication for group creation with adminId:",
      req.body.adminId
    );
    req.user = { _id: req.body.adminId };
    return next();
  }

  // For other endpoints, try to extract user info from params or body
  if (req.params && req.params.userId) {
    req.user = { _id: req.params.userId };
    console.log("Using userId from params as fallback:", req.user);
    return next();
  } else if (req.body && req.body.userId) {
    req.user = { _id: req.body.userId };
    console.log("Using userId from body as fallback:", req.user);
    return next();
  } else if (req.body && req.body.adminId) {
    req.user = { _id: req.body.adminId };
    console.log("Using adminId from body as fallback:", req.user);
    return next();
  }

  // Last resort placeholder for development
  console.log("Using placeholder user ID as last resort");
  req.user = { _id: "placeholder_user_id" };
  return next();

  // In production, uncomment this and remove the placeholder:
  // return res.status(401).json({ message: "Not authenticated" });
};

// Create a new study group - with extensive logging
router.post("/", isAuthenticated, async (req, res) => {
  // Existing implementation...
  try {
    console.log("Creating new study group with data:", req.body);
    const { name, classId, isPrivate, adminId, members } = req.body;

    // Validate input with detailed feedback
    if (!name) {
      console.log("Missing group name");
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!classId) {
      console.log("Missing classId");
      return res.status(400).json({ message: "Class ID is required" });
    }

    if (!adminId) {
      console.log("Missing adminId");
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Validate IDs are valid MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      console.log("Invalid classId format:", classId);
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      console.log("Invalid adminId format:", adminId);
      return res.status(400).json({ message: "Invalid admin ID format" });
    }

    // Create the group
    const newGroup = new Group({
      name,
      classId,
      isPrivate: isPrivate || false,
      adminId,
      members: members || [adminId],
    });

    console.log("New group object:", newGroup);

    const savedGroup = await newGroup.save();
    console.log("Group saved successfully with ID:", savedGroup._id);

    res.status(201).json(savedGroup);
  } catch (error) {
    console.error("❌ Error creating study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get study groups for a user with manual field mapping to handle issues
router.get("/user/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdHeader = req.headers['x-user-id'];
    
    // Use header userId if available, fallback to param
    const effectiveUserId = userIdHeader || userId;
    
    console.log(`Fetching study groups for user: ${effectiveUserId}`);
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(effectiveUserId)) {
      console.log("Invalid userId format:", effectiveUserId);
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Find all groups where user is a member or admin - using multiple query approaches for safety
    const groups = await Group.find({
      $or: [
        { members: effectiveUserId },
        { adminId: effectiveUserId },
        { "members": { $in: [effectiveUserId] } },
        { "members": { $in: [new mongoose.Types.ObjectId(effectiveUserId)] } } // Added 'new' keyword here
      ]
    });
    
    console.log(`Found ${groups.length} groups for user ${effectiveUserId}`);
    
    // Debug logs to see group membership details
    groups.forEach(group => {
      console.log(`Group ${group._id} - ${group.name}:`);
      console.log(`  Admin: ${group.adminId}`);
      console.log(`  Members: ${JSON.stringify(group.members)}`);
      console.log(`  Is user in members array? ${group.members.some(m => m.toString() === effectiveUserId.toString())}`);
    });
    
    // Manually fetch class data for each group
    const populatedGroups = await Promise.all(
      groups.map(async (group) => {
        try {
          // Convert group to plain object
          const groupObj = group.toObject();
          
          console.log(
            `Processing group ${groupObj._id} with classId ${groupObj.classId}`
          );
          
          // Fetch class details if classId exists
          if (groupObj.classId) {
            try {
              // Try to get class model - fallback if model name is different
              let ClassModel;
              try {
                ClassModel = mongoose.model("Course");
              } catch (err) {
                try {
                  ClassModel = mongoose.model("Class");
                } catch (err2) {
                  console.log("Neither 'Course' nor 'Class' models found");
                  // Create a placeholder for class
                  groupObj.class = {
                    _id: groupObj.classId,
                    courseCode: "Unknown Code",
                    title: "Unknown Class",
                  };
                  return groupObj;
                }
              }
              
              // Now try to find the class
              const classDetails = await ClassModel.findById(groupObj.classId);
              
              if (classDetails) {
                console.log(
                  `Found class details for ${groupObj.classId}:`,
                  classDetails.courseCode || "No Code"
                );
                groupObj.class = {
                  _id: classDetails._id,
                  courseCode: classDetails.courseCode || "No Code",
                  title: classDetails.title || "No Title",
                };
              } else {
                console.log(`Class ${groupObj.classId} not found`);
                groupObj.class = {
                  _id: groupObj.classId,
                  courseCode: "Unknown Code",
                  title: "Unknown Class",
                };
              }
            } catch (classError) {
              console.error(
                `Error fetching class ${groupObj.classId}:`,
                classError
              );
              groupObj.class = {
                _id: groupObj.classId,
                courseCode: "Error Loading",
                title: "Error Loading Class",
              };
            }
          }
          
          // Count members with fallback
          groupObj.memberCount = groupObj.members ? groupObj.members.length : 0;
          
          // Add user-specific flags
          groupObj.isAdmin = group.adminId.toString() === effectiveUserId.toString();
          groupObj.isMember = group.members.some(m => m.toString() === effectiveUserId.toString());
          
          return groupObj;
        } catch (error) {
          console.error(`Error populating group ${group._id}:`, error);
          // Return basic group info as fallback
          return {
            _id: group._id,
            name: group.name || "Unnamed Group",
            classId: group.classId,
            adminId: group.adminId,
            isPrivate: group.isPrivate || false,
            members: group.members || [],
            memberCount: group.members ? group.members.length : 0,
          };
        }
      })
    );
    
    console.log(`Returning ${populatedGroups.length} populated groups`);
    res.json(populatedGroups);
  } catch (error) {
    console.error("❌ Error fetching user study groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a specific study group with detailed error handling
// Replace the existing main GET /:id route with this:
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log(`Fetching details for group ${id} for user ${userId}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    console.log(`Found group ${id}:`, group.name);

    // Manually populate class details
    const groupObj = group.toObject();
    if (groupObj.classId) {
      try {
        // Try to get class model - fallback if model name is different
        let ClassModel;
        try {
          ClassModel = mongoose.model("Course");
        } catch (err) {
          try {
            ClassModel = mongoose.model("Class");
          } catch (err2) {
            console.log("Neither 'Course' nor 'Class' models found");
          }
        }

        if (ClassModel) {
          const classDetails = await ClassModel.findById(groupObj.classId);
          if (classDetails) {
            groupObj.class = classDetails;
          }
        }
      } catch (classError) {
        console.error(`Error fetching class ${groupObj.classId}:`, classError);
      }
    }

    // Determine user status 
    const isAdmin = group.adminId.toString() === userId.toString();
    console.log(`Admin check: User ID ${userId}, Group admin ${group.adminId}, Result: ${isAdmin}`);
    
    // Check if user is a member using string comparison
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    
    // Check for pending request using string comparison
    const hasPendingRequest = group.joinRequests && group.joinRequests.some(
      (req) => req.userId && req.userId.toString() === userId.toString()
    );
    
    // Log the results for debugging
    console.log(`User status for ${userId} in group ${id}:`);
    console.log(`- Admin: ${isAdmin}`);
    console.log(`- Member: ${isMember}`);
    console.log(`- Pending Request: ${hasPendingRequest}`);
    
    // Add user-specific status flags
    groupObj.isAdmin = isAdmin;
    groupObj.isMember = isMember;
    groupObj.hasPendingRequest = hasPendingRequest;

    res.json(groupObj);
  } catch (error) {
    console.error("❌ Error fetching study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a study group
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isPrivate } = req.body;
    const userId = req.user._id;

    console.log(`Updating group ${id} with data:`, req.body);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      console.log(`User ${userId} is not admin of group ${id}`);
      return res
        .status(403)
        .json({ message: "Not authorized to update this group" });
    }

    // Update the group
    group.name = name || group.name;
    group.isPrivate = isPrivate !== undefined ? isPrivate : group.isPrivate;

    const updatedGroup = await group.save();
    console.log(`Group ${id} updated successfully`);

    res.json(updatedGroup);
  } catch (error) {
    console.error("❌ Error updating study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a study group
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`Deleting group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      console.log(`User ${userId} is not admin of group ${id}`);
      return res
        .status(403)
        .json({ message: "Not authorized to delete this group" });
    }

    await Group.findByIdAndDelete(id);
    console.log(`Group ${id} deleted successfully`);

    res.json({ message: "Study group deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get members of a study group
router.get("/:id/members", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Fetching members for group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group and populate the members
    const group = await Group.findById(id).populate(
      "members",
      "username email"
    );

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    console.log(`Found ${group.members.length} members for group ${id}`);
    res.json(group.members);
  } catch (error) {
    console.error("❌ Error fetching group members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get join requests for a study group
router.get("/:id/join-requests", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`Fetching join requests for group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      console.log(`User ${userId} is not admin of group ${id}`);
      console.log(`Group admin is: ${group.adminId}`);
      return res
        .status(403)
        .json({ message: "Not authorized to view join requests" });
    }

    // If the group has no join requests array or it's empty, return empty array
    if (!group.joinRequests || group.joinRequests.length === 0) {
      console.log(`No join requests for group ${id}`);
      return res.json([]);
    }

    // Populate user data for join requests
    try {
      const populatedGroup = await Group.findById(id).populate({
        path: "joinRequests.userId",
        select: "username email",
      });

      // Format join requests for frontend
      const requests = populatedGroup.joinRequests.map((request) => ({
        _id: request._id,
        user: request.userId,
        requestedAt: request.requestedAt,
      }));

      console.log(`Found ${requests.length} join requests for group ${id}`);
      res.json(requests);
    } catch (populateError) {
      console.error("Error populating join requests:", populateError);

      // Fallback - return unpopulated join requests
      const requests = group.joinRequests.map((request) => ({
        _id: request._id,
        userId: request.userId,
        requestedAt: request.requestedAt,
      }));

      console.log(`Returning ${requests.length} unpopulated join requests`);
      res.json(requests);
    }
  } catch (error) {
    console.error("❌ Error fetching join requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:id/join", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log(`User ${userId} attempting to join group ${id}`);
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is already a member (using proper string comparison)
    const isAlreadyMember = group.members.some(memberId => 
      memberId.toString() === userId.toString()
    );
    
    if (isAlreadyMember) {
      console.log(`User ${userId} is already a member of group ${id}`);
      return res.status(400).json({ 
        message: "You are already a member of this group",
        joined: true
      });
    }
    
    // If group is private, create a join request instead of direct join
    if (group.isPrivate) {
      // Check if request already exists
      const existingRequest = group.joinRequests.some(
        req => req.userId && req.userId.toString() === userId.toString()
      );
      
      if (existingRequest) {
        console.log(`User ${userId} already has a pending request for private group ${id}`);
        return res.status(400).json({ 
          message: "You already have a pending join request for this group",
          pending: true
        });
      }
      
      // Add join request
      group.joinRequests.push({
        userId,
        requestedAt: new Date()
      });
      
      await group.save();
      console.log(`Created join request for private group ${id}`);
      
      return res.json({
        message: "Join request sent successfully. Waiting for admin approval.",
        pending: true,
        joined: false
      });
    }
    
    // For public groups, add user directly to members
    console.log("Before adding member, current members:", group.members.map(m => m.toString()));
    
    // Try to convert to ObjectId if it's not already one
    let userObjectId;
    try {
      userObjectId = mongoose.Types.ObjectId(userId);
    } catch (e) {
      console.error("Error converting userId to ObjectId:", e);
      userObjectId = userId; // Fallback to using as is
    }
    
    // Add the user to members
    group.members.push(userObjectId);
    
    await group.save();
    console.log("After adding member, current members:", group.members.map(m => m.toString()));
    
    res.json({
      message: "You've joined the group successfully",
      joined: true,
      pending: false
    });
  } catch (error) {
    console.error("❌ Error joining study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request to join a study group
router.post("/:id/join-request", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`User ${userId} requesting to join group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      console.log(`User ${userId} is already a member of group ${id}`);
      return res
        .status(400)
        .json({ message: "You are already a member of this group" });
    }

    // Check if user already has a pending request
    const existingRequest = group.joinRequests.find(
      (req) => req.userId.toString() === userId.toString()
    );

    if (existingRequest) {
      console.log(
        `User ${userId} already has a pending request for group ${id}`
      );
      return res
        .status(400)
        .json({ message: "You already have a pending join request" });
    }

    // Add join request
    group.joinRequests.push({
      userId,
      requestedAt: new Date(),
    });

    await group.save();
    console.log(
      `Join request from user ${userId} for group ${id} created successfully`
    );

    res.json({ message: "Join request sent successfully" });
  } catch (error) {
    console.error("❌ Error sending join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Approve a join request
router.post(
  "/:id/approve-request/:requestId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { id, requestId } = req.params;
      const userId = req.user._id;

      console.log(`Approving join request ${requestId} for group ${id}`);

      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("Invalid group ID format:", id);
        return res.status(400).json({ message: "Invalid group ID" });
      }

      // Find the group
      const group = await Group.findById(id);

      if (!group) {
        console.log(`Group ${id} not found`);
        return res.status(404).json({ message: "Study group not found" });
      }

      // Check if user is admin
      if (group.adminId.toString() !== userId.toString()) {
        console.log(`User ${userId} is not admin of group ${id}`);
        return res
          .status(403)
          .json({ message: "Not authorized to approve requests" });
      }

      // Find the request
      const requestIndex = group.joinRequests.findIndex(
        (req) => req._id.toString() === requestId
      );

      if (requestIndex === -1) {
        console.log(`Join request ${requestId} not found in group ${id}`);
        return res.status(404).json({ message: "Join request not found" });
      }

      // Get user ID from request
      const requestUserId = group.joinRequests[requestIndex].userId;
      console.log(`Found request user ID: ${requestUserId}`);

      // Remove request and add user to members
      group.joinRequests.splice(requestIndex, 1);

      if (!group.members.includes(requestUserId)) {
        group.members.push(requestUserId);
      }

      await group.save();
      console.log(`Join request ${requestId} approved successfully`);

      res.json({ message: "Join request rejected successfully" });
    } catch (error) {
      console.error("❌ Error rejecting join request:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Leave a study group
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`User ${userId} leaving group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is admin
    if (group.adminId.toString() === userId.toString()) {
      console.log(`User ${userId} is admin of group ${id} and cannot leave`);
      return res
        .status(400)
        .json({
          message:
            "Admins cannot leave their own group. Please delete the group instead.",
        });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      console.log(`User ${userId} is not a member of group ${id}`);
      return res
        .status(400)
        .json({ message: "You are not a member of this group" });
    }

    // Remove user from members
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    await group.save();
    console.log(`User ${userId} left group ${id} successfully`);

    res.json({ message: "You have left the study group" });
  } catch (error) {
    console.error("❌ Error leaving study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove a member from a study group
router.post(
  "/:id/remove-member/:memberId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { id, memberId } = req.params;
      const userId = req.user._id;

      console.log(`Removing member ${memberId} from group ${id}`);

      // Validate IDs
      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(memberId)
      ) {
        console.log("Invalid ID format: group:", id, "member:", memberId);
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Find the group
      const group = await Group.findById(id);

      if (!group) {
        console.log(`Group ${id} not found`);
        return res.status(404).json({ message: "Study group not found" });
      }

      // Check if user is admin
      if (group.adminId.toString() !== userId.toString()) {
        console.log(`User ${userId} is not admin of group ${id}`);
        return res
          .status(403)
          .json({ message: "Not authorized to remove members" });
      }

      // Cannot remove admin
      if (memberId === group.adminId.toString()) {
        console.log(`Cannot remove admin ${memberId} from group ${id}`);
        return res
          .status(400)
          .json({ message: "Cannot remove the group admin" });
      }

      // Check if member exists
      if (!group.members.includes(memberId)) {
        console.log(`Member ${memberId} not found in group ${id}`);
        return res
          .status(404)
          .json({ message: "Member not found in this group" });
      }

      // Remove the member
      group.members = group.members.filter(
        (member) => member.toString() !== memberId
      );

      await group.save();
      console.log(`Member ${memberId} removed from group ${id} successfully`);

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("❌ Error removing member:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.get("/:id/user-status", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`Checking status of user ${userId} in group ${id}`);

    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid group ID format:", id);
      return res.status(400).json({ message: "Invalid group ID" });
    }

    // Find the group
    const group = await Group.findById(id);

    if (!group) {
      console.log(`Group ${id} not found`);
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check user status - always using string comparison
    const isAdmin = group.adminId.toString() === userId.toString();

    // Check if user is a member using string comparison
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    // Check for pending request using string comparison
    const hasPendingRequest = group.joinRequests.some(
      (req) => req.userId && req.userId.toString() === userId.toString()
    );

    // Log the results for debugging
    console.log(`User status for ${userId} in group ${id}:`);
    console.log(`- Admin: ${isAdmin}`);
    console.log(`- Member: ${isMember}`);
    console.log(`- Pending Request: ${hasPendingRequest}`);

    res.json({
      status: isAdmin
        ? "admin"
        : isMember
        ? "member"
        : hasPendingRequest
        ? "pending"
        : "none",
      isAdmin,
      isMember,
      hasPendingRequest,
    });
  } catch (error) {
    console.error("❌ Error checking user status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Replace the existing GET /class/:classId route with this:
router.get("/class/:classId", isAuthenticated, async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;
    
    console.log(`Fetching study groups for class: ${classId}`);
    console.log(`Current user: ${userId}`);
    
    // Validate class ID
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      console.log("Invalid class ID format:", classId);
      return res.status(400).json({ message: "Invalid class ID format" });
    }
    
    // Find ALL groups for this class (both public and private)
    // We'll show private groups with a "Request to Join" button
    const groups = await Group.find({ classId });
    
    console.log(`Found ${groups.length} groups for class ${classId}`);
    
    // Convert groups to plain objects and add user-specific info
    const formattedGroups = groups.map(group => {
      const plainGroup = group.toObject();
      
      // Check if current user is admin
      const isAdmin = group.adminId.toString() === userId.toString();
      
      // Check if current user is member - convert ObjectIds to strings for comparison
      const isMember = group.members.some(memberId => 
        memberId.toString() === userId.toString()
      );
      
      // Check for pending request using string comparison
      const hasPendingRequest = group.joinRequests && group.joinRequests.some(
        req => req.userId && req.userId.toString() === userId.toString()
      );
      
      // Add visible flag - determines if group should be shown in UI
      // Show if: public OR user is member/admin OR user has pending request
      const isVisible = !group.isPrivate || isMember || isAdmin || hasPendingRequest;
      
      // Always include the group but mark it as visible or not
      return {
        ...plainGroup,
        isAdmin,
        isMember,
        hasPendingRequest,
        isVisible,
        memberCount: group.members.length
      };
    });
    
    res.json(formattedGroups);
  } catch (error) {
    console.error("❌ Error fetching class study groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/pending-requests", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(`Getting pending join requests for user ${userId}`);

    // Find all groups where user has a pending request
    const groups = await Group.find({
      "joinRequests.userId": userId,
    });

    // Format the response
    const pendingRequests = groups.map((group) => ({
      groupId: group._id,
      groupName: group.name,
      classId: group.classId,
      requestedAt: group.joinRequests.find(
        (req) => req.userId.toString() === userId.toString()
      ).requestedAt,
    }));

    res.json(pendingRequests);
  } catch (error) {
    console.error("❌ Error fetching pending requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Basic group creation endpoint from the calendar-export branch
// Keeping this for backward compatibility
router.post("/create", async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Group name and members array are required" });
    }

    const memberObjectIds = members.map((id) => new mongoose.Types.ObjectId(id));

    const newGroup = new Group({
      name,
      members: memberObjectIds,
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Basic get all groups endpoint from the calendar-export branch
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().populate("members", "username email");
    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Basic get group by ID endpoint from the calendar-export branch
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await Group.findById(groupId).populate("members", "username email");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("❌ Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Basic join group endpoint from the calendar-export branch
router.post("/:groupId/join", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid groupId or userId" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res.status(200).json({ message: "User added to group", group });
  } catch (error) {
    console.error("❌ Error joining group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;