import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5001";

const Bookmarks = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("all");
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/bookmarks/user`, {
          withCredentials: true,
        });
        // Filter out any bookmarks with missing course or resource data
        const validBookmarks = response.data.filter(
          (bookmark) => bookmark.course && bookmark.resource
        );
        setBookmarks(validBookmarks);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch bookmarks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  // Get unique classes from bookmarks
  const classes = [
    ...new Set(
      bookmarks
        .filter((bookmark) => bookmark.course && bookmark.course._id)
        .map((bookmark) => bookmark.course._id)
    ),
  ].map((courseId) => {
    const bookmark = bookmarks.find(
      (b) => b.course && b.course._id === courseId
    );
    return {
      id: courseId,
      name: bookmark?.course?.title || "Unknown Course",
      courseCode: bookmark?.course?.courseCode || "N/A",
    };
  });

  // Filter resources based on selected class
  const filteredBookmarks =
    selectedClass === "all"
      ? bookmarks
      : bookmarks.filter(
          (bookmark) => bookmark.course && bookmark.course._id === selectedClass
        );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading bookmarks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button and filter */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bookmarked Resources</h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back</span>
          </button>
        </div>

        {/* Class filter */}
        {classes.length > 0 && (
          <div className="flex items-center space-x-3">
            <label className="text-gray-700 dark:text-gray-300">
              Filter by class:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Classes</option>
              {classes.map((classInfo) => (
                <option key={classInfo.id} value={classInfo.id}>
                  {classInfo.courseCode} - {classInfo.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {bookmark.resource?.title || "Untitled Resource"}
                  </h3>
                  <span className="text-2xl">🔖</span>
                </div>
                <div className="mb-3">
                  <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                    {bookmark.course?.courseCode || "N/A"} -{" "}
                    {bookmark.course?.title || "Unknown Course"}
                  </span>
                </div>
                {bookmark.resource?.url && (
                  <a
                    href={bookmark.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-500 break-all"
                  >
                    {bookmark.resource.url}
                  </a>
                )}
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Bookmarked on{" "}
                  {new Date(bookmark.dateBookmarked).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {selectedClass === "all" ? (
            <p className="text-gray-600 dark:text-gray-400">
              You haven't bookmarked any resources yet.
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No bookmarked resources found for this class.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
