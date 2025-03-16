import express from "express";
import mongoose from "mongoose";
import Group from "./models/Group.js";
import User from "../models/User.js"; // Assuming you have a User model

const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated || req.user) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
};

// Create a new study group
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, classId, isPrivate, adminId, members } = req.body;
    
    // Validate input
    if (!name || !classId || !adminId) {
      return res.status(400).json({ message: "Name, class, and admin are required" });
    }
    
    // Create the group
    const newGroup = new Group({
      name,
      classId,
      isPrivate: isPrivate || false,
      adminId,
      members: members || [adminId],
    });
    
    const savedGroup = await newGroup.save();
    
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error("❌ Error creating study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get study groups for a user (both as member and admin)
router.get("/user/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Find all groups where user is a member or admin
    const groups = await Group.find({
      $or: [
        { members: userId },
        { adminId: userId }
      ]
    }).populate('classId', 'courseCode title');
    
    // Format response for frontend
    const formattedGroups = groups.map(group => ({
      ...group.toObject(),
      class: group.classId,
      classId: group.classId._id
    }));
    
    res.json(formattedGroups);
  } catch (error) {
    console.error("❌ Error fetching user study groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a specific study group
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    const group = await Group.findById(id).populate('classId', 'courseCode title');
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    res.json(group);
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
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this group" });
    }
    
    // Update the group
    group.name = name || group.name;
    group.isPrivate = isPrivate !== undefined ? isPrivate : group.isPrivate;
    
    const updatedGroup = await group.save();
    
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
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this group" });
    }
    
    await Group.findByIdAndDelete(id);
    
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
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group and populate the members
    const group = await Group.findById(id).populate('members', 'username email');
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
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
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to view join requests" });
    }
    
    // Populate user data for join requests
    const populatedGroup = await Group.findById(id).populate({
      path: 'joinRequests.userId',
      select: 'username email'
    });
    
    // Format join requests for frontend
    const requests = populatedGroup.joinRequests.map(request => ({
      _id: request._id,
      user: request.userId,
      requestedAt: request.requestedAt
    }));
    
    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching join requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request to join a study group
router.post("/:id/join-request", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }
    
    // Check if user already has a pending request
    const existingRequest = group.joinRequests.find(
      req => req.userId.toString() === userId.toString()
    );
    
    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending join request" });
    }
    
    // Add join request
    group.joinRequests.push({
      userId,
      requestedAt: new Date()
    });
    
    await group.save();
    
    res.json({ message: "Join request sent successfully" });
  } catch (error) {
    console.error("❌ Error sending join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Approve a join request
router.post("/:id/approve-request/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.user._id;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to approve requests" });
    }
    
    // Find the request
    const requestIndex = group.joinRequests.findIndex(
      req => req._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: "Join request not found" });
    }
    
    // Get user ID from request
    const requestUserId = group.joinRequests[requestIndex].userId;
    
    // Remove request and add user to members
    group.joinRequests.splice(requestIndex, 1);
    
    if (!group.members.includes(requestUserId)) {
      group.members.push(requestUserId);
    }
    
    await group.save();
    
    res.json({ message: "Join request approved successfully" });
  } catch (error) {
    console.error("❌ Error approving join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reject a join request
router.post("/:id/reject-request/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.user._id;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to reject requests" });
    }
    
    // Find and remove the request
    const requestIndex = group.joinRequests.findIndex(
      req => req._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: "Join request not found" });
    }
    
    group.joinRequests.splice(requestIndex, 1);
    await group.save();
    
    res.json({ message: "Join request rejected successfully" });
  } catch (error) {
    console.error("❌ Error rejecting join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Leave a study group
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Admins cannot leave their own group. Please delete the group instead." });
    }
    
    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }
    
    // Remove user from members
    group.members = group.members.filter(
      memberId => memberId.toString() !== userId.toString()
    );
    
    await group.save();
    
    res.json({ message: "You have left the study group" });
  } catch (error) {
    console.error("❌ Error leaving study group:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove a member from a study group
router.post("/:id/remove-member/:memberId", isAuthenticated, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }
    
    // Check if user is admin
    if (group.adminId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to remove members" });
    }
    
    // Cannot remove admin
    if (memberId === group.adminId.toString()) {
      return res.status(400).json({ message: "Cannot remove the group admin" });
    }
    
    // Check if member exists
    if (!group.members.includes(memberId)) {
      return res.status(404).json({ message: "Member not found in this group" });
    }
    
    // Remove the member
    group.members = group.members.filter(
      member => member.toString() !== memberId
    );
    
    await group.save();
    
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("❌ Error removing member:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;