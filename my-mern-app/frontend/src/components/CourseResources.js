import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5001";

const CourseResources = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

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
        fetchResources(); // Only fetch resources if authenticated
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
      ".gif": "🖼️",
      ".mp3": "🎵",
      ".wav": "🎵",
      ".mp4": "🎥",
      ".mov": "🎥",
    };
    return icons[fileType] || "📁";
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course Resources
          </h1>
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {getFileIcon(resource.fileType)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {resource.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleVote(resource._id, "upvote")}
                      className="flex items-center space-x-1 hover:text-green-600"
                    >
                      <span>👍</span>
                      <span>{resource.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(resource._id, "downvote")}
                      className="flex items-center space-x-1 hover:text-red-600"
                    >
                      <span>👎</span>
                      <span>{resource.downvotes}</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Download
                    </a>
                    {resource.postedBy?._id === user?._id && (
                      <button
                        onClick={() => handleDelete(resource._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Posted by {resource.postedBy?.username} on{" "}
                  {new Date(resource.datePosted).toLocaleDateString()}
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
