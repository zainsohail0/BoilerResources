import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5001";

const CourseResources = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editResourceData, setEditResourceData] = useState({
    title: "",
    description: "",
  });
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    type: "document",
    file: null,
  });
  const [error, setError] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [commentSortOrder, setCommentSortOrder] = useState("newest");
  const [copySuccess, setCopySuccess] = useState(null);
  const [resourceSortOrder, setResourceSortOrder] = useState("newest");

  // Filter states
  const [resourceTypes, setResourceTypes] = useState([
    "document",
    "image",
    "audio",
    "video",
  ]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filteredResources, setFilteredResources] = useState([]);

  // Add these to your state variables in CourseResources.js
  const [commentVotes, setCommentVotes] = useState({});

  // Add a function to fetch comment vote statuses
  const fetchCommentVoteStatuses = async (resourceComments) => {
    try {
      const voteStatuses = {};
      for (const comment of resourceComments) {
        // Find which resource this comment belongs to
        const resourceWithComment = resources.find(
          (resource) =>
            resource.comments &&
            resource.comments.some((c) => c._id === comment._id)
        );

        if (!resourceWithComment) continue;

        // Fetch status for top-level comments
        const response = await axios.get(
          `${API_URL}/api/resources/${resourceWithComment._id}/comments/${comment._id}/vote-status`,
          { withCredentials: true }
        );
        voteStatuses[comment._id] = response.data.voteStatus;

        // Fetch status for replies if they exist
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            const replyResponse = await axios.get(
              `${API_URL}/api/resources/${resourceWithComment._id}/comments/${reply._id}/vote-status`,
              { withCredentials: true }
            );
            voteStatuses[reply._id] = replyResponse.data.voteStatus;
          }
        }
      }
      setCommentVotes(voteStatuses);
    } catch (err) {
      console.error("Error fetching comment vote statuses:", err);
    }
  };

  // Call this after fetching resources
  useEffect(() => {
    if (resources.length > 0) {
      const allComments = resources.flatMap((resource) =>
        resource.comments ? resource.comments : []
      );
      if (allComments.length > 0) {
        fetchCommentVoteStatuses(allComments);
      }
    }
  }, [resources]);

  // Add a function for handling comment votes
  const handleCommentVote = async (resourceId, commentId, voteType) => {
    try {
      // Make sure we have valid IDs
      if (!resourceId || !commentId) {
        setError("Invalid resource or comment ID");
        return;
      }

      // Ensure user is authenticated
      if (!user || !user._id) {
        setError("You must be logged in to vote");
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/resources/${resourceId}/comments/${commentId}/vote`,
        { voteType, userId: user._id }, // Explicitly pass the userId
        { withCredentials: true }
      );

      // Update the comment's vote count in the state
      setResources((prevResources) =>
        prevResources.map((resource) => {
          if (resource._id === resourceId) {
            return {
              ...resource,
              comments: updateCommentWithVote(
                resource.comments,
                commentId,
                response.data.comment
              ),
            };
          }
          return resource;
        })
      );

      // Update the user's vote status for this comment
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: response.data.comment.userVoteType,
      }));
    } catch (err) {
      console.error("Error voting on comment:", err);
      setError(err.response?.data?.message || "Failed to vote on comment");
    }
  };

  // Helper function to update a comment in the nested structure
  const updateCommentWithVote = (comments, commentId, updatedComment) => {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        return {
          ...comment,
          upvotes: updatedComment.upvotes,
          downvotes: updatedComment.downvotes,
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map((reply) =>
            reply._id === commentId
              ? {
                  ...reply,
                  upvotes: updatedComment.upvotes,
                  downvotes: updatedComment.downvotes,
                }
              : reply
          ),
        };
      }
      return comment;
    });
  };

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching resources for course:", courseId);

      const res = await axios.get(
        `${API_URL}/api/resources/course/${courseId}?sortBy=${resourceSortOrder}`,
        {
          withCredentials: true,
        }
      );

      if (Array.isArray(res.data)) {
        console.log("Setting resources state with:", res.data.length, "items");

        // Process comments to create a nested structure for replies
        const processedResources = res.data.map((resource) => {
          if (!resource.comments) {
            return { ...resource, comments: [] };
          }

          // Create a map of comments by their ID
          const commentMap = {};
          resource.comments.forEach((comment) => {
            commentMap[comment._id] = {
              ...comment,
              replies: [],
            };
          });

          // Create hierarchical structure
          const topLevelComments = [];
          resource.comments.forEach((comment) => {
            if (comment.parentComment) {
              // This is a reply, add it to its parent's replies
              const parentComment = commentMap[comment.parentComment];
              if (parentComment) {
                parentComment.replies.push(comment);
              }
            } else {
              // This is a top-level comment
              topLevelComments.push(commentMap[comment._id]);
            }
          });

          // Sort top-level comments
          const sortedTopLevelComments = [...topLevelComments].sort((a, b) => {
            if (commentSortOrder === "newest") {
              const dateA = new Date(a.datePosted);
              const dateB = new Date(b.datePosted);
              return dateB - dateA;
            } else if (commentSortOrder === "oldest") {
              const dateA = new Date(a.datePosted);
              const dateB = new Date(b.datePosted);
              return dateA - dateB;
            } else if (commentSortOrder === "mostVotes") {
              // Calculate net votes (upvotes - downvotes)
              const netVotesA = (a.upvotes || 0) - (a.downvotes || 0);
              const netVotesB = (b.upvotes || 0) - (b.downvotes || 0);
              return netVotesB - netVotesA;
            }
            return 0;
          });

          // Sort replies for each comment
          sortedTopLevelComments.forEach((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.sort((a, b) => {
                if (commentSortOrder === "newest") {
                  const dateA = new Date(a.datePosted);
                  const dateB = new Date(b.datePosted);
                  return dateB - dateA;
                } else if (commentSortOrder === "oldest") {
                  const dateA = new Date(a.datePosted);
                  const dateB = new Date(b.datePosted);
                  return dateA - dateB;
                } else if (commentSortOrder === "mostVotes") {
                  const netVotesA = (a.upvotes || 0) - (a.downvotes || 0);
                  const netVotesB = (b.upvotes || 0) - (b.downvotes || 0);
                  return netVotesB - netVotesA;
                }
                return 0;
              });
            }
          });

          return {
            ...resource,
            comments: sortedTopLevelComments,
          };
        });

        // If sorting by mostVotes, sort here
        let sortedResources = [...processedResources];

        if (resourceSortOrder === "mostVotes") {
          sortedResources = sortedResources
            .map((resource) => ({
              ...resource,
              netVotes: (resource.upvotes || 0) - (resource.downvotes || 0),
            }))
            .sort((a, b) => b.netVotes - a.netVotes || new Date(b.datePosted) - new Date(a.datePosted));
        }

        setResources(sortedResources);
        setFilteredResources(sortedResources);

        //setResources(processedResources);
        //setFilteredResources(processedResources); // Initialize filtered resources

      } else {
        console.error("Unexpected response format:", res.data);
        setError("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching resources:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Failed to fetch resources");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, resourceSortOrder, commentSortOrder]);
  //[courseId, commentSortOrder]);

  // Apply filters when selectedTypes changes
  useEffect(() => {
    if (resources.length > 0) {
      let filtered = [...resources];

      // Apply type filter
      if (selectedTypes.length > 0) {
        filtered = filtered.filter((resource) =>
          selectedTypes.includes(resource.type)
        );
      }

      setFilteredResources(filtered);
    }
  }, [selectedTypes, resources, resourceSortOrder]);

  // Toggle filter selection
  const toggleTypeFilter = (type) => {
    const updatedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(updatedTypes);
    localStorage.setItem("resourceFilterTypes", JSON.stringify(updatedTypes));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes([]);
    localStorage.removeItem("resourceFilterTypes");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedTypes.length > 0;
  };

  // Load saved filter preferences
  useEffect(() => {
    const savedTypes =
      JSON.parse(localStorage.getItem("resourceFilterTypes")) || [];
    setSelectedTypes(savedTypes);
  }, []);
  //[commentSortOrder, courseId, fetchResources]);

  useEffect(() => {
    if (courseId) {
      fetchResources();
    }
  }, [resourceSortOrder, courseId, fetchResources]);

  // Check bookmark status for all resources
  useEffect(() => {
    const checkBookmarkStatuses = async () => {
      try {
        const bookmarkStatuses = {};
        for (const resource of resources) {
          const response = await axios.get(
            `${API_URL}/api/bookmarks/resource/${resource._id}/status`,
            { withCredentials: true }
          );
          bookmarkStatuses[resource._id] = response.data.isBookmarked;
        }
        setBookmarks(bookmarkStatuses);
      } catch (err) {
        console.error("Error checking bookmark statuses:", err);
      }
    };

    if (resources.length > 0) {
      checkBookmarkStatuses();
    }
  }, [resources]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (resourceId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/bookmarks/resource/${resourceId}`,
        {},
        { withCredentials: true }
      );
      setBookmarks((prev) => ({
        ...prev,
        [resourceId]: response.data.isBookmarked,
      }));
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      setError(err.response?.data?.message || "Failed to update bookmark");
    }
  };

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        setUser(res.data);
        // Fetch resources after authentication
        fetchResources();
      } catch (err) {
        console.error("Authentication error:", err);
        navigate("/login", {
          state: { from: `/course/${courseId}/resources` },
        });
      }
    };

    if (courseId) {
      checkAuth();
    }
  }, [courseId, navigate, fetchResources]);

  const handleShare = (resource) => {
    if (!resource.url) {
      console.error("No URL found for resource:", resource);
      return;
    }
  
    navigator.clipboard.writeText(resource.url).then(() => {
      setCopySuccess(resource._id);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch((err) => {
      console.error("Failed to copy link:", err);
    });
  };

  /*
  const handleShare = (resourceId) => {
    const resourceLink = `${window.location.origin}/resources/${resourceId}`;
    navigator.clipboard.writeText(resourceLink).then(() => {
      setCopySuccess(resourceId); // Set the ID of the resource that was copied
      setTimeout(() => setCopySuccess(null), 2000); // Clear the confirmation after 2 seconds
    });
  };
  */

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    formData.append("type", uploadData.type);
    formData.append("file", uploadData.file);
    formData.append("courseId", courseId);

    try {
      const response = await axios.post(
        `${API_URL}/api/resources/course/${courseId}/upload`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setShowUploadForm(false);
      setUploadData({
        title: "",
        description: "",
        type: "document",
        file: null,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await fetchResources();
    } catch (err) {
      console.error("Upload error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        courseId: courseId,
      });
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed handleVote function to match the simpler but working implementation
  // while maintaining the robust state updates
  // Modified handleVote function to mirror the working handleCommentVote approach
  // Fixed handleVote function to exactly match the working approach
  // This is an adaptation of the handleCommentVote function that works for resources
const handleVote = async (resourceId, voteType) => {
  try {
    // Validate resource ID
    if (!resourceId) {
      setError("Invalid resource ID");
      return;
    }

    // Check for user
    if (!user || !user._id) {
      setError("You must be logged in to vote");
      return;
    }

    // Send a request in the exact same format as the working comment vote function
    const response = await axios.post(
      `${API_URL}/api/resources/${resourceId}/vote`,
      { voteType }, // Keep this simple, exactly like the comment vote
      { withCredentials: true }
    );
    
    // After the vote, just fetch all resources again
    // This is simpler than trying to update the local state
    fetchResources();
  } catch (err) {
    console.error("Error processing resource vote:", err);
    setError(err.response?.data?.message || "Vote failed");
  }
};

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;

    try {
      await axios.delete(`${API_URL}/api/resources/${resourceId}`, {
        withCredentials: true,
      });
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      ".pdf": "📄",
      ".doc": "📝",
      ".docx": "📝",
      ".ppt": "📊",
      ".pptx": "📊",
      ".jpg": "🖼️",
      ".png": "🖼️",
      ".gif": "🎞️",
      ".mp3": "🎵",
      ".wav": "🎵",
      ".mp4": "🎥",
      ".mov": "🎥",
    };
    return icons[fileType] || "📁";
  };

  // Add comment to a resource
  const handleCommentSubmit = async (resourceId, e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/resources/${resourceId}/comments`,
        { content: newComment },
        { withCredentials: true }
      );

      // Update the resource's comments
      setResources((prevResources) =>
        prevResources.map((resource) => {
          if (resource._id === resourceId) {
            // Add new comment to top-level comments
            return {
              ...resource,
              comments: [
                ...(resource.comments || []),
                { ...response.data, replies: [] },
              ],
            };
          }
          return resource;
        })
      );

      setNewComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  // Add reply to a comment
  const handleReplySubmit = async (resourceId, commentId, e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/resources/${resourceId}/comments/${commentId}/reply`,
        { content: replyText },
        { withCredentials: true }
      );

      // Update the resource's comments
      setResources((prevResources) =>
        prevResources.map((resource) => {
          if (resource._id === resourceId) {
            return {
              ...resource,
              comments: resource.comments.map((comment) => {
                if (comment._id === commentId) {
                  // Ensure replies array exists and add new reply
                  const currentReplies = Array.isArray(comment.replies)
                    ? comment.replies
                    : [];
                  return {
                    ...comment,
                    replies: [...currentReplies, response.data],
                  };
                }
                return comment;
              }),
            };
          }
          return resource;
        })
      );

      // Clear reply state
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Error adding reply:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.details ||
        "Failed to add reply";
      alert(errorMessage);
    }
  };

  // Edit a comment
  const handleEditComment = async (
    resourceId,
    commentId,
    content,
    parentCommentId = null
  ) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/resources/${resourceId}/comments/${commentId}`,
        { content },
        { withCredentials: true }
      );

      // Update the comment in the resource
      setResources((prevResources) =>
        prevResources.map((resource) => {
          if (resource._id === resourceId) {
            if (!parentCommentId) {
              // Top-level comment
              return {
                ...resource,
                comments: resource.comments.map((comment) =>
                  comment._id === commentId
                    ? { ...comment, ...response.data }
                    : comment
                ),
              };
            } else {
              // Reply to a comment
              return {
                ...resource,
                comments: resource.comments.map((comment) => {
                  if (comment._id === parentCommentId) {
                    return {
                      ...comment,
                      replies: comment.replies.map((reply) =>
                        reply._id === commentId
                          ? { ...reply, ...response.data }
                          : reply
                      ),
                    };
                  }
                  return comment;
                }),
              };
            }
          }
          return resource;
        })
      );

      setEditingComment(null);
      setEditCommentText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to edit comment");
    }
  };

  // Delete a comment
  const handleDeleteComment = async (
    resourceId,
    commentId,
    parentCommentId = null
  ) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      await axios.delete(
        `${API_URL}/api/resources/${resourceId}/comments/${commentId}`,
        { withCredentials: true }
      );

      // Remove the comment from the resource
      setResources((prevResources) =>
        prevResources.map((resource) => {
          if (resource._id === resourceId) {
            if (!parentCommentId) {
              // Delete top-level comment
              return {
                ...resource,
                comments: resource.comments.filter(
                  (comment) => comment._id !== commentId
                ),
              };
            } else {
              // Delete reply
              return {
                ...resource,
                comments: resource.comments.map((comment) => {
                  if (comment._id === parentCommentId) {
                    return {
                      ...comment,
                      replies: comment.replies.filter(
                        (reply) => reply._id !== commentId
                      ),
                    };
                  }
                  return comment;
                }),
              };
            }
          }
          return resource;
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const CommentItem = ({ comment, resourceId, parentCommentId = null }) => {
    const isReply = !!parentCommentId;
    const isEditing = editingComment === comment._id;
    const isReplying = replyingTo === comment._id;
    const userVoteType = commentVotes[comment._id] || null;

    return (
      <div
        className={`${
          isReply
            ? "ml-6 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3"
            : "mb-3"
        } bg-gray-50 dark:bg-gray-700 p-3 rounded-lg`}
      >
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {comment.author?.username || "Unknown User"}
          </span>
          <div className="flex space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.datePosted).toLocaleDateString()}
            </span>
            <div className="flex space-x-2">
              {user && (
                <button
                  onClick={() => {
                    setReplyingTo(comment._id);
                    setReplyText("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Reply
                </button>
              )}
              {user?._id === comment.author?._id && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment._id);
                      setEditCommentText(comment.content);
                    }}
                    className="text-xs text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteComment(
                        resourceId,
                        comment._id,
                        parentCommentId
                      )
                    }
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditComment(
                resourceId,
                comment._id,
                editCommentText,
                parentCommentId
              );
            }}
            className="mt-2"
          >
            <textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              rows="2"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                type="button"
                onClick={() => setEditingComment(null)}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {comment.content}
            </p>

            {/* Vote controls */}
            <div className="flex items-center mt-2 space-x-4">
              <button
                onClick={() => handleCommentVote(resourceId, comment._id, "upvote")}
                className={`text-xs flex items-center ${
                  userVoteType === "upvote"
                    ? "text-green-500 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
                }`}
              >
                <span className="mr-1">👍</span>
                <span>{comment.upvotes || 0}</span>
              </button>
              <button
                onClick={() => handleCommentVote(resourceId, comment._id, "downvote")}
                className={`text-xs flex items-center ${
                  userVoteType === "downvote"
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                }`}
              >
                <span className="mr-1">👎</span>
                <span>{comment.downvotes || 0}</span>
              </button>
            </div>
          </>
        )}

        {isReplying && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReplySubmit(resourceId, comment._id, e);
            }}
            className="mt-3"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              rows="2"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Reply
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                resourceId={resourceId}
                parentCommentId={comment._id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleEditResource = async (resourceId, e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_URL}/api/resources/${resourceId}`,
        editResourceData,
        { withCredentials: true }
      );

      // Update the resource in the state
      setResources((prevResources) =>
        prevResources.map((resource) =>
          resource._id === resourceId ? response.data : resource
        )
      );
      setFilteredResources((prevResources) =>
        prevResources.map((resource) =>
          resource._id === resourceId ? response.data : resource
        )
      );

      setEditingResource(null);
      setEditResourceData({ title: "", description: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to edit resource");
    }
  };

  return (
    <div className="course-resources">
      <style jsx>{`
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .comment-sort-dropdown {
          padding: 0.5rem;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          background-color: white;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .comment-sort-dropdown:hover {
          border-color: #9ca3af;
        }

        .comment-sort-dropdown:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        @media (prefers-color-scheme: dark) {
          .comment-sort-dropdown {
            background-color: #1f2937;
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .comment-sort-dropdown:hover {
            border-color: #6b7280;
          }
        }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate("/bookmarks")}
            className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            <span className="text-xl">🔖</span>
            <span>View My Bookmarks</span>
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">Course Resources</h2>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {filtersVisible ? "Hide Filters" : "Show Filters"}
            </button>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {filtersVisible && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Filter by Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {resourceTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTypes.includes(type)
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowUploadForm(true)}
            disabled={isLoading}
            className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
          >
            Upload Resource
          </button>
          {/* Resource Sort Dropdown */}
          <select
            value={resourceSortOrder}
            onChange={(e) => setResourceSortOrder(e.target.value)}
            className="comment-sort-dropdown"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostVotes">Most Votes</option>
          </select>
        </div>

        {showUploadForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Upload New Resource
            </h3>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Type:
                </label>
                <select
                  id="type"
                  value={uploadData.type}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, type: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  File:
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) =>
                    setUploadData({ ...uploadData, file: e.target.files[0] })
                  }
                  className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50 ml-2"
                >
                  {isLoading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {filteredResources.length === 0 && !isLoading ? (
          <p className="text-gray-600 dark:text-gray-400">
            No resources found for this course.
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredResources.map((resource) => (
              <li
                key={resource._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="text-xl mr-2">
                        {getFileIcon(resource.fileUrl?.split(".").pop())}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {editingResource === resource._id ? (
                          <input
                            type="text"
                            value={editResourceData.title}
                            onChange={(e) =>
                              setEditResourceData({
                                ...editResourceData,
                                title: e.target.value,
                              })
                            }
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        ) : (
                          resource.title
                        )}
                      </h3>
                    </div>
                    {editingResource === resource._id ? (
                      <textarea
                        value={editResourceData.description}
                        onChange={(e) =>
                          setEditResourceData({
                            ...editResourceData,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows="2"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Uploaded on{" "}
                      {new Date(resource.uploadDate).toLocaleDateString()} by{" "}
                      {resource.uploader?.username || "Unknown"}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <button
                        //onClick={() => handleVote(resource._id, "upvote")}
                        onClick={() => {
                          console.log("Upvote clicked for resource:", resource._id);
                          handleVote(resource._id, "upvote")}
                        }
                        className="text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
                      >
                        👍 {resource.upvotes || 0}
                      </button>
                      <button
                        onClick={() => {
                          console.log("Downvote clicked for resource:", resource._id);
                          handleVote(resource._id, "downvote")}
                        }
                        //onClick={() => handleVote(resource._id, "downvote")}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                        👎 {resource.downvotes || 0}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user && (
                      <button
                        onClick={() => handleBookmarkToggle(resource._id)}
                        className={`text-xl ${
                          bookmarks[resource._id]
                            ? "text-yellow-500 dark:text-yellow-400"
                            : "text-gray-400 dark:text-gray-500"
                        } hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors`}
                        title={
                          bookmarks[resource._id]
                            ? "Remove Bookmark"
                            : "Bookmark"
                        }
                      >
                        🔖
                      </button>
                    )}
                    <button
                      onClick={() => handleShare(resource)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      🔗 Share
                    </button>
                    {copySuccess === resource._id && (
                      <span className="text-green-500 text-xs">Copied!</span>
                    )}
                    {user?._id === resource.uploader?._id && (
                      <>
                        {editingResource === resource._id ? (
                          <>
                            <button
                              onClick={(e) =>
                                handleEditResource(resource._id, e)
                              }
                              className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingResource(null);
                                setEditResourceData({
                                  title: "",
                                  description: "",
                                });
                              }}
                              className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingResource(resource._id);
                              setEditResourceData({
                                title: resource.title,
                                description: resource.description,
                              });
                            }}
                            className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(resource._id)}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Download
                    </a>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Comments
                  </h4>
                  <div className="comments-header">
                    {user && (
                      <form
                        onSubmit={(e) => handleCommentSubmit(resource._id, e)}
                        className="w-full pr-2"
                      >
                        <div className="flex">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full min-h-[40px] sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 ml-2"
                            disabled={!newComment.trim()}
                          >
                            Comment
                          </button>
                        </div>
                      </form>
                    )}
                    {/* Comment Sort Dropdown */}
                    <select
                      value={commentSortOrder}
                      onChange={(e) => setCommentSortOrder(e.target.value)}
                      className="comment-sort-dropdown"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mostVotes">Most Votes</option>
                    </select>
                  </div>
                  {resource.comments && resource.comments.length > 0 ? (
                    resource.comments.map((comment) => (
                      <CommentItem
                        key={comment._id}
                        comment={comment}
                        resourceId={resource._id}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No comments yet. Be the first to start the discussion!
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CourseResources;
