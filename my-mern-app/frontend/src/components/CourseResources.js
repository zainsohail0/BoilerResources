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

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching resources for course:", courseId);
      const res = await axios.get(
        `${API_URL}/api/resources/course/${courseId}?sortBy=${commentSortOrder}`,
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
            const dateA = new Date(a.datePosted);
            const dateB = new Date(b.datePosted);
            return commentSortOrder === "newest"
              ? dateB - dateA
              : dateA - dateB;
          });

          // Sort replies for each comment
          sortedTopLevelComments.forEach((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.sort((a, b) => {
                const dateA = new Date(a.datePosted);
                const dateB = new Date(b.datePosted);
                return commentSortOrder === "newest"
                  ? dateB - dateA
                  : dateA - dateB;
              });
            }
          });

          return {
            ...resource,
            comments: sortedTopLevelComments,
          };
        });

        setResources(processedResources);
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
  }, [courseId, commentSortOrder]);

  // Add effect to handle sort order changes
  useEffect(() => {
    if (courseId) {
      fetchResources();
    }
  }, [commentSortOrder, courseId, fetchResources]);

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

  const handleVote = async (resourceId, voteType) => {
    try {
      await axios.post(
        `${API_URL}/api/resources/${resourceId}/vote`,
        { voteType },
        { withCredentials: true }
      );
      fetchResources();
    } catch (err) {
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
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {comment.content}
          </p>
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

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowUploadForm(true)}
            disabled={isLoading}
            className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Upload New Resource"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showUploadForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Upload New Resource
            </h2>
            <form onSubmit={handleUploadSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setUploadData({ ...uploadData, file: e.target.files[0] })
                    }
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-300"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                  >
                    {isLoading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Loading resources...
            </p>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {resource.type.charAt(0).toUpperCase() +
                            resource.type.slice(1)}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {resource.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {resource.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBookmarkToggle(resource._id)}
                      className="text-2xl hover:text-yellow-500 transition-colors"
                      title={
                        bookmarks[resource._id]
                          ? "Remove from bookmarks"
                          : "Add to bookmarks"
                      }
                    >
                      {bookmarks[resource._id] ? "🔖" : "📑"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Posted by {resource.postedBy?.username || "Unknown"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(resource.datePosted).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleVote(resource._id, "upvote")}
                        className="text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
                      >
                        👍 {resource.upvotes || 0}
                      </button>
                      <button
                        onClick={() => handleVote(resource._id, "downvote")}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        👎 {resource.downvotes || 0}
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      {resource.type === "link" ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-yellow-700 dark:bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
                        >
                          Visit Link
                        </a>
                      ) : (
                        <a
                          href={resource.url}
                          download
                          className="bg-yellow-700 dark:bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
                        >
                          Download
                        </a>
                      )}
                      {user?._id === resource.postedBy?._id && (
                        <button
                          onClick={() => handleDelete(resource._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Comments
                      </h4>
                      <select
                        value={commentSortOrder}
                        onChange={(e) => setCommentSortOrder(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>

                    {/* Comment Form */}
                    <form
                      onSubmit={(e) => handleCommentSubmit(resource._id, e)}
                      className="mb-4"
                    >
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition"
                        >
                          Post
                        </button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {resource.comments?.map((comment) => (
                        <CommentItem
                          key={comment._id}
                          comment={comment}
                          resourceId={resource._id}
                          parentCommentId={null}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No resources have been uploaded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseResources;
