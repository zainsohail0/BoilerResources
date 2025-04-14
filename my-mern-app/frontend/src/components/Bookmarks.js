import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Bookmarks = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("all");

  // Get bookmarked resources from localStorage
  const bookmarkedResources = JSON.parse(
    localStorage.getItem("bookmarkedResources") || "[]"
  );

  // Get unique classes from bookmarks
  const classes = useMemo(() => {
    const uniqueClasses = new Set(
      bookmarkedResources
        .filter((resource) => resource.class)
        .map((resource) => JSON.stringify(resource.class))
    );
    return Array.from(uniqueClasses).map((classStr) => JSON.parse(classStr));
  }, [bookmarkedResources]);

  // Filter resources based on selected class
  const filteredResources = useMemo(() => {
    if (selectedClass === "all") {
      return bookmarkedResources;
    }
    return bookmarkedResources.filter(
      (resource) => resource.class?.id === selectedClass
    );
  }, [bookmarkedResources, selectedClass]);

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

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {resource.title}
                  </h3>
                  <span className="text-2xl">🔖</span>
                </div>
                {resource.class && (
                  <div className="mb-3">
                    <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                      {resource.class.courseCode} - {resource.class.name}
                    </span>
                  </div>
                )}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-500 break-all"
                >
                  {resource.url}
                </a>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Bookmarked on{" "}
                  {new Date(resource.dateBookmarked).toLocaleDateString()}
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
