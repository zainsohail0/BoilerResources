import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5001";

// Add resource owner info for the static resource
const STATIC_RESOURCE_OWNER = {
  email: "owner@example.com", // Replace with actual owner's email
  username: "Resource Owner",
};

// Add static class info for the demo resource
const STATIC_CLASS_INFO = {
  id: "cs307",
  name: "Software Engineering",
  courseCode: "CS 307",
};

const CourseResources = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editText, setEditText] = useState("");
  const [commentSort, setCommentSort] = useState("newest");

  // Initialize bookmark state from localStorage
  const [isBookmarked, setIsBookmarked] = useState(() => {
    const bookmarkedResources = JSON.parse(
      localStorage.getItem("bookmarkedResources") || "[]"
    );
    return bookmarkedResources.some(
      (r) =>
        r.url ===
        "https://www.cs.purdue.edu/academic-programs/courses/canonical/cs307.html"
    );
  });

  // Initialize comments from localStorage with support for replies
  const [comments, setComments] = useState(() => {
    return JSON.parse(localStorage.getItem("staticResourceComments") || "[]");
  });

  // Handle bookmark toggle with localStorage persistence
  const handleBookmarkToggle = () => {
    const bookmarkedResources = JSON.parse(
      localStorage.getItem("bookmarkedResources") || "[]"
    );
    const resourceUrl =
      "https://www.cs.purdue.edu/academic-programs/courses/canonical/cs307.html";

    if (isBookmarked) {
      // Remove from bookmarks
      const updatedBookmarks = bookmarkedResources.filter(
        (r) => r.url !== resourceUrl
      );
      localStorage.setItem(
        "bookmarkedResources",
        JSON.stringify(updatedBookmarks)
      );
    } else {
      // Add to bookmarks with class information
      const newBookmark = {
        id: new Date().getTime(),
        title: "Web Site Resource for Students",
        url: resourceUrl,
        dateBookmarked: new Date().toISOString(),
        class: {
          id: STATIC_CLASS_INFO.id,
          name: STATIC_CLASS_INFO.name,
          courseCode: STATIC_CLASS_INFO.courseCode,
        },
      };
      localStorage.setItem(
        "bookmarkedResources",
        JSON.stringify([...bookmarkedResources, newBookmark])
      );
    }
    setIsBookmarked(!isBookmarked);
  };

  // Send email notification for new comment
  const sendCommentNotification = async (
    comment,
    isReply = false,
    parentComment = null
  ) => {
    try {
      await axios.post(`${API_URL}/api/resources/notify`, {
        resourceOwnerEmail: STATIC_RESOURCE_OWNER.email,
        resourceTitle: "Web Site Resource for Students",
        commentAuthor: comment.author,
        commentText: comment.text,
        resourceUrl:
          "https://www.cs.purdue.edu/academic-programs/courses/canonical/cs307.html",
        isReply,
        parentCommentAuthor: parentComment?.author,
      });
    } catch (err) {
      console.error("Failed to send comment notification:", err);
    }
  };

  // Handle comment submission with notification
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: new Date().getTime(),
      text: newComment.trim(),
      author: user?.username || "Anonymous",
      timestamp: new Date().toISOString(),
      replies: [],
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    localStorage.setItem(
      "staticResourceComments",
      JSON.stringify(updatedComments)
    );
    setNewComment("");

    // Send notification to resource owner
    await sendCommentNotification(comment);
  };

  // Handle reply submission with notification
  const handleReplySubmit = async (parentCommentId) => {
    if (!replyText.trim()) return;

    const reply = {
      id: new Date().getTime(),
      text: replyText.trim(),
      author: user?.username || "Anonymous",
      timestamp: new Date().toISOString(),
    };

    const parentComment = comments.find((c) => c.id === parentCommentId);
    const updatedComments = comments.map((comment) => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply],
        };
      }
      return comment;
    });

    setComments(updatedComments);
    localStorage.setItem(
      "staticResourceComments",
      JSON.stringify(updatedComments)
    );
    setReplyText("");
    setReplyingTo(null);

    // Send notification for reply
    if (parentComment) {
      await sendCommentNotification(reply, true, parentComment);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      const updatedComments = comments.filter(
        (comment) => comment.id !== commentId
      );
      setComments(updatedComments);
      localStorage.setItem(
        "staticResourceComments",
        JSON.stringify(updatedComments)
      );
    }
  };

  // Handle reply deletion
  const handleDeleteReply = (commentId, replyId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== replyId),
          };
        }
        return comment;
      });
      setComments(updatedComments);
      localStorage.setItem(
        "staticResourceComments",
        JSON.stringify(updatedComments)
      );
    }
  };

  // Handle comment edit
  const handleEditComment = (commentId) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditText(comment.text);
    }
  };

  // Handle reply edit
  const handleEditReply = (commentId, replyId) => {
    const comment = comments.find((c) => c.id === commentId);
    const reply = comment?.replies.find((r) => r.id === replyId);
    if (reply) {
      setEditingReply(replyId);
      setEditText(reply.text);
    }
  };

  // Save comment edit
  const handleSaveCommentEdit = (commentId) => {
    if (!editText.trim()) return;

    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          text: editText.trim(),
          edited: true,
          editedAt: new Date().toISOString(),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    localStorage.setItem(
      "staticResourceComments",
      JSON.stringify(updatedComments)
    );
    setEditingComment(null);
    setEditText("");
  };

  // Save reply edit
  const handleSaveReplyEdit = (commentId, replyId) => {
    if (!editText.trim()) return;

    const updatedComments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: comment.replies.map((reply) => {
            if (reply.id === replyId) {
              return {
                ...reply,
                text: editText.trim(),
                edited: true,
                editedAt: new Date().toISOString(),
              };
            }
            return reply;
          }),
        };
      }
      return comment;
    });

    setComments(updatedComments);
    localStorage.setItem(
      "staticResourceComments",
      JSON.stringify(updatedComments)
    );
    setEditingReply(null);
    setEditText("");
  };

  console.log("Component mounted with courseId:", courseId);

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

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching resources for course:", courseId);
      const res = await axios.get(
        `${API_URL}/api/resources/course/${courseId}`,
        {
          withCredentials: true,
        }
      );
      console.log("API Response:", {
        status: res.status,
        headers: res.headers,
        data: res.data,
      });

      if (Array.isArray(res.data)) {
        console.log("Setting resources state with:", res.data.length, "items");
        setResources(res.data);
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
  }, [courseId]);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        setUser(res.data);

        // Add hardcoded resource
        const hardcodedResource = {
          _id: new Date().getTime().toString(), // Temporary ID
          title: "Course Website",
          description: "Official course website for Software Engineering",
          type: "link",
          url: "https://www.cs.purdue.edu/",
          fileType: ".link",
          datePosted: new Date(),
          upvotes: 0,
          downvotes: 0,
          postedBy: {
            _id: res.data._id,
            username: res.data.username,
          },
        };

        setResources((prevResources) => [...prevResources, hardcodedResource]);

        // Also fetch other resources
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
    //formData.append("courseId", courseId);

    console.log("Preparing upload with courseId:", courseId);
    console.log("FormData contents:", {
      title: uploadData.title,
      description: uploadData.description,
      type: uploadData.type,
      courseId: courseId,
    });

    try {
      console.log(
        "Starting upload to:",
        `${API_URL}/api/resources/course/${courseId}/upload`
      );
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
      console.log("Upload response:", {
        status: response.status,
        data: response.data,
        courseId: response.data.courseId,
      });

      setShowUploadForm(false);
      setUploadData({
        title: "",
        description: "",
        type: "document",
        file: null,
      });

      // Wait for a moment to ensure database consistency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch resources again with explicit courseId
      console.log("Refetching resources for courseId:", courseId);
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
      ".gif": "��️",
      ".mp3": "🎵",
      ".wav": "🎵",
      ".mp4": "🎥",
      ".mov": "🎥",
    };
    return icons[fileType] || "📁";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation link to bookmarks */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/bookmarks")}
          className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
        >
          <span className="text-xl">🔖</span>
          <span>View My Bookmarks</span>
        </button>
      </div>

      {/* Static Sample Resource Box */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
            Web Site Resource for Students
          </h3>
          <button
            onClick={handleBookmarkToggle}
            className="text-2xl hover:text-yellow-500 transition-colors"
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            {isBookmarked ? "🔖" : "📑"}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          https://www.cs.purdue.edu/academic-programs/courses/canonical/cs307.html
        </p>

        {/* Comments Section */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Comments
            </h4>
            <select
              value={commentSort}
              onChange={(e) => setCommentSort(e.target.value)}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {[...comments]
              .sort((a, b) => {
                if (commentSort === "newest") {
                  return new Date(b.timestamp) - new Date(a.timestamp);
                } else {
                  return new Date(a.timestamp) - new Date(b.timestamp);
                }
              })
              .map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  {/* Main comment */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {comment.author}
                      </span>
                      {comment.edited && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (edited{" "}
                          {new Date(comment.editedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                      {comment.author === user?.username && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingComment === comment.id ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveCommentEdit(comment.id)}
                        disabled={!editText.trim()}
                        className="bg-yellow-700 dark:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditText("");
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {comment.text}
                    </p>
                  )}

                  {/* Reply button */}
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id
                      )
                    }
                    className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 mb-3"
                  >
                    {replyingTo === comment.id ? "Cancel Reply" : "Reply"}
                  </button>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="ml-6 mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyText.trim()}
                          className="bg-yellow-700 dark:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies list */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-white dark:bg-gray-600 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                {reply.author}
                              </span>
                              {reply.edited && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  (edited{" "}
                                  {new Date(
                                    reply.editedAt
                                  ).toLocaleDateString()}
                                  )
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(reply.timestamp).toLocaleDateString()}
                              </span>
                              {reply.author === user?.username && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleEditReply(comment.id, reply.id)
                                    }
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteReply(comment.id, reply.id)
                                    }
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {editingReply === reply.id ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                onClick={() =>
                                  handleSaveReplyEdit(comment.id, reply.id)
                                }
                                disabled={!editText.trim()}
                                className="bg-yellow-700 dark:bg-yellow-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-yellow-800 dark:hover:bg-yellow-700 transition disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingReply(null);
                                  setEditText("");
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {reply.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            {comments.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {resource.title}
                  </h3>
                  <span className="text-2xl">
                    {getFileIcon(resource.fileType)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {resource.description}
                </p>
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
  );
};

export default CourseResources;
