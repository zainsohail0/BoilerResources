import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const API_URL = "http://localhost:5001";
const MIN_CREDIT_HOURS = 12;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userClasses, setUserClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check if we're being instructed to refresh from navigation state
  const shouldRefreshGroups = location.state?.refreshGroups;
  const newGroupId = location.state?.newGroupId;

  const handleReportContent = () => navigate("/report");
  const handleAdminReports = () => navigate("/admin/reports");

  useEffect(() => {
    // Clear the location state to prevent refreshing on future navigations
    if (shouldRefreshGroups) {
      window.history.replaceState({}, document.title);
    }
  }, [shouldRefreshGroups]);

  useEffect(() => {
    // Load completed classes from localStorage
    const completed =
      JSON.parse(localStorage.getItem("completedClasses")) || [];
    setCompletedClasses(completed);
  }, []);

  useEffect(() => {
    if (location.state?.refreshGroups) {
      console.log("Refresh groups trigger detected:", location.state);
      // You could also force a refetch here if needed
    }
  }, [location.state]);

  useEffect(() => {
    console.log("Current localStorage contents:");
    console.log("userId:", localStorage.getItem("userId"));
    console.log(
      "token:",
      localStorage.getItem("token") ? "Present" : "Missing"
    );
    // Check all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}:`, localStorage.getItem(key));
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching user data...");
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Authentication failed");

        const data = await res.json();
        console.log("User data fetched:", data);
        setUser(data);
        fetchUserClasses(data._id);

        // Force refresh if coming from study group creation
        if (shouldRefreshGroups && newGroupId) {
          console.log(
            `Will fetch groups with focus on new group: ${newGroupId}`
          );
          fetchUserStudyGroups(data._id, newGroupId);
        } else {
          fetchUserStudyGroups(data._id);
        }

        // Fetch pending join requests
        fetchPendingJoinRequests(data._id);
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // No auto-refresh intervals
  }, [navigate, shouldRefreshGroups, newGroupId]);

  const fetchUserClasses = async (userId) => {
    try {
      console.log(`Fetching classes for user ${userId}...`);
      const res = await fetch(
        `${API_URL}/api/courses/user/${userId}/enrolled`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch enrolled classes");

      const data = await res.json();
      console.log("Classes fetched:", data);
      setUserClasses(data);
      setTotalCredits(
        data.reduce((sum, classItem) => sum + (classItem.creditHours || 0), 0)
      );
    } catch (err) {
      console.error("❌ Error fetching enrolled classes:", err);
      setErrorMessage(err.message);
    }
  };

  const fetchPendingJoinRequests = async (userId) => {
    try {
      console.log("Fetching pending join requests...");
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/groups/pending-requests`, {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Pending join requests fetched:", data);
        setPendingJoinRequests(data);
      }
    } catch (err) {
      console.error("❌ Error fetching pending join requests:", err);
    }
  };

  const fetchUserStudyGroups = async (userId, highlightGroupId = null) => {
    try {
      console.log(`Fetching study groups for user ${userId}...`);
      // Add cache-busting query parameter
      const timestamp = new Date().getTime();
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-User-ID": userId,
      };

      const res = await fetch(
        `${API_URL}/api/groups/user/${userId}?t=${timestamp}`,
        {
          credentials: "include",
          headers,
        }
      );

      console.log("Study groups response status:", res.status);

      if (!res.ok) {
        console.error(
          "Failed to fetch study groups:",
          res.status,
          res.statusText
        );
        const errorText = await res.text();
        console.error("Error response:", errorText);

        // Use fallback from localStorage if API fails
        tryFallbackGroups(userId, highlightGroupId);
        return;
      }

      const data = await res.json();
      console.log("Study groups fetched:", data);

      // Store in localStorage as backup for future fallbacks
      localStorage.setItem("lastFetchedGroups", JSON.stringify(data));

      if (Array.isArray(data) && data.length > 0) {
        // Ensure we have class details for each group
        const groupsWithClasses = data.map((group) => {
          // Find the corresponding class in userClasses by ID
          if (group.classId && userClasses.length > 0) {
            const classInfo = userClasses.find((c) => c._id === group.classId);
            if (classInfo) {
              return {
                ...group,
                class: {
                  _id: classInfo._id,
                  courseCode: classInfo.courseCode || "Unknown",
                  title: classInfo.title || "Unknown",
                },
              };
            }
          }
          return group;
        });

        console.log(
          "Setting study groups with class details:",
          groupsWithClasses
        );
        setStudyGroups(groupsWithClasses);

        // If we have a new group ID to highlight, make sure it's in the list
        if (highlightGroupId && !data.some((g) => g._id === highlightGroupId)) {
          console.log(
            `New group ${highlightGroupId} not found in API response, trying fallback...`
          );
          tryFallbackGroups(userId, highlightGroupId, groupsWithClasses);
        }
      } else {
        console.log("No study groups returned from API, trying fallback...");

        // First check if we had previously fetched groups
        const lastFetched = localStorage.getItem("lastFetchedGroups");
        if (lastFetched) {
          try {
            const parsedGroups = JSON.parse(lastFetched);
            if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
              console.log("Using previously fetched groups from localStorage");
              setStudyGroups(parsedGroups);
              return;
            }
          } catch (e) {
            console.error("Error parsing lastFetchedGroups:", e);
          }
        }

        // If no previous fetch, try the standard fallback
        tryFallbackGroups(userId, highlightGroupId);
      }
    } catch (err) {
      console.error("❌ Error fetching study groups:", err);
      // Try to recover with localStorage data
      tryFallbackGroups(userId, highlightGroupId);
    }
  };

  // Fallback method to get study groups from localStorage if API fails
  const tryFallbackGroups = (userId, highlightGroupId, existingGroups = []) => {
    try {
      const createdGroups = JSON.parse(
        localStorage.getItem("createdStudyGroups") || "[]"
      );
      console.log("Fallback: Created groups from localStorage:", createdGroups);

      if (createdGroups.length > 0) {
        // Filter for this user's groups
        const userGroups = createdGroups.filter(
          (g) => g.adminId === userId || g.members.includes(userId)
        );

        if (userGroups.length > 0) {
          // If we have a new group to highlight, make sure it's included
          let updatedGroups = [...existingGroups];

          if (highlightGroupId) {
            const highlightGroup = createdGroups.find(
              (g) => g._id === highlightGroupId
            );
            if (
              highlightGroup &&
              !updatedGroups.some((g) => g._id === highlightGroupId)
            ) {
              updatedGroups.push(highlightGroup);
            }
          }

          // Add any other local groups not in the API response
          userGroups.forEach((localGroup) => {
            if (!updatedGroups.some((g) => g._id === localGroup._id)) {
              updatedGroups.push(localGroup);
            }
          });

          console.log(
            "Setting study groups with fallback data:",
            updatedGroups
          );
          setStudyGroups(updatedGroups);
        }
      } else if (highlightGroupId) {
        // Last resort: check if we have the ID of the last created group
        const lastGroupId = localStorage.getItem("lastCreatedGroupId");
        if (lastGroupId === highlightGroupId) {
          // Create a placeholder group
          const placeholder = {
            _id: highlightGroupId,
            name: "Recently Created Group",
            adminId: userId,
            members: [userId],
            createdAt: new Date().toISOString(),
            isPlaceholder: true,
          };

          console.log("Adding placeholder group:", placeholder);
          setStudyGroups([...existingGroups, placeholder]);
        }
      }
    } catch (err) {
      console.error("❌ Error using fallback groups:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Logout failed");

      setUser(null);
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  const handleAddClass = () => navigate("/add-class");
  const handleDeleteClass = () => navigate("/delete-class");
  const handleDeleteCompletedClass = () => navigate("/delete-completed-class");
  const handleViewProfile = () => navigate("/profile");
  const handleCreateStudyGroup = () => navigate("/create-study-group");
  const handleViewStudyGroup = (groupId) => navigate(`/study-group/${groupId}`);
  const handleViewClassGroups = (classId) =>
    navigate(`/class/${classId}/groups`);
  const handleViewPendingRequests = () => navigate("/pending-requests");
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const handleFeedbackForm = () => navigate("/feedback");

  const handleGoToCalendar = () => navigate("/calendar");

  const handleMarkAsComplete = (classToComplete) => {
    const completedClass = {
      _id: classToComplete._id,
      code: classToComplete.courseCode,
      name: classToComplete.title,
      credits: classToComplete.creditHours,
      completed: true,
    };

    if (user && user._id) {
      // This would normally make an API call to unenroll
      // For now, we'll just remove it locally
      const updatedEnrolled = userClasses.filter(
        (c) => c._id !== classToComplete._id
      );
      setUserClasses(updatedEnrolled);
      setTotalCredits(
        updatedEnrolled.reduce((sum, item) => sum + (item.creditHours || 0), 0)
      );
    }

    const updatedCompleted = [...completedClasses, completedClass];
    setCompletedClasses(updatedCompleted);
    localStorage.setItem("completedClasses", JSON.stringify(updatedCompleted));
  };

  const handleRemoveCompletedClass = (classToRemove) => {
    // Filter out the class to be removed
    const updatedCompleted = completedClasses.filter(
      (c) => c._id !== classToRemove._id
    );
    setCompletedClasses(updatedCompleted);
    localStorage.setItem("completedClasses", JSON.stringify(updatedCompleted));
  };

  // Force refresh button handler
  const handleForceRefresh = () => {
    if (user && user._id) {
      console.log("Manually refreshing study groups...");
      fetchUserStudyGroups(user._id);
      fetchPendingJoinRequests(user._id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">
                Boiler Resources
              </span>
            </div>
            <div className="relative flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white">Welcome, {user.username}!</span>

                  {/* Report Button */}
                  <button
                    onClick={handleReportContent}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Report Content
                  </button>

                  {/* ✅ Calendar Button */}
                  <button
                    onClick={handleGoToCalendar}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                  >
                    View Calendar
                  </button>

                  <ThemeToggle />

                  <div className="relative">
                    <button
                      onClick={toggleDropdown}
                      className="text-white bg-black dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6h16M4 12h16m-7 6h7"
                        />
                      </svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2 z-20">
                        <button
                          onClick={handleViewProfile}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={handleFeedbackForm}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Feedback Form
                        </button>
                        {/* Admin Reports Option (Only show for admins) */}
                        {user.isAdmin && (
                          <button
                            onClick={handleAdminReports}
                            className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Admin Reports
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-white">Welcome, Guest!</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Block */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Welcome to Boiler Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This is your dashboard where you can access and manage your
            resources.
          </p>
        </div>

        {/* Enrolled Classes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user ? `${user.username}'s` : "Your"} Enrolled Classes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Credits: {totalCredits}
                {totalCredits < MIN_CREDIT_HOURS && (
                  <span className="text-red-500 dark:text-red-400 ml-2">
                    (Minimum: {MIN_CREDIT_HOURS})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddClass}
                className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
              >
                Add Class
              </button>
              <button
                onClick={handleDeleteClass}
                className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
              >
                Delete Class
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {userClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {classItem.courseCode}
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200">
                    {classItem.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Credits: {classItem.creditHours}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/class/${classItem._id}`)}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/course/${classItem._id}/resources`)
                      }
                      className="bg-yellow-600 dark:bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition"
                    >
                      View Resources
                    </button>
                    {/* New button for Study Groups */}
                    <button
                      onClick={() => handleViewClassGroups(classItem._id)}
                      className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition"
                    >
                      Study Groups
                    </button>
                    <button
                      onClick={() => handleMarkAsComplete(classItem)}
                      className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition"
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              You haven't added any classes yet. Click "Add Class" to get
              started.
            </p>
          )}
        </div>

        {/* Study Groups Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user ? `${user.username}'s` : "Your"} Study Groups
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connect with classmates and study together.
                {pendingJoinRequests.length > 0 && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                    (You have {pendingJoinRequests.length} pending join
                    requests)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateStudyGroup}
                className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
                style={{ display: "block" }}
              >
                Create Study Group
              </button>
              {pendingJoinRequests.length > 0 && (
                <button
                  onClick={handleViewPendingRequests}
                  className="bg-yellow-600 dark:bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition"
                >
                  View Pending Requests
                </button>
              )}
              <button
                onClick={handleForceRefresh}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                style={{ display: "block" }}
              >
                Refresh Groups
              </button>

              {/* Add Clear Storage button here */}
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  console.log("Storage cleared");
                  window.location.reload();
                }}
                className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
              >
                Clear Storage
              </button>
            </div>
          </div>

          {studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.map((group) => (
                <div
                  key={group._id}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200">
                    {group.class?.courseCode
                      ? `${group.class.courseCode} - ${group.class.title}`
                      : userClasses.find((c) => c._id === group.classId)
                      ? `${
                          userClasses.find((c) => c._id === group.classId)
                            .courseCode
                        } - ${
                          userClasses.find((c) => c._id === group.classId).title
                        }`
                      : "Class information unavailable"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.isPrivate ? "Private Group" : "Public Group"} •{" "}
                    {group.memberCount || group.members?.length || 0} members
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => handleViewStudyGroup(group._id)}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    >
                      View Group
                    </button>
                    {/* New button for the enhanced group details */}
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="bg-teal-600 dark:bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 transition"
                    >
                      Group Details
                    </button>
                    {group.adminId === user._id && (
                      <button
                        onClick={() =>
                          navigate(`/manage-study-group/${group._id}`)
                        }
                        className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              You haven't joined any study groups yet. Create one or search for
              existing groups.
            </p>
          )}
        </div>

        {/* User's Completed Classes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user ? `${user.username}'s` : "Your"} Completed Classes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Keep track of the courses you've already completed.
              </p>
            </div>
          </div>

          {completedClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {completedClasses.map((classItem, index) => (
                <div
                  key={classItem._id || index}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {classItem.code}
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200">
                    {classItem.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Credits: {classItem.credits}
                  </p>
                  <button
                    onClick={() => handleRemoveCompletedClass(classItem)}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              You don't have any completed classes yet. Mark classes as complete
              from your enrolled classes.
            </p>
          )}
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              My Resources
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your saved resources
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Browse Categories
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore resources by category
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Community
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with other users
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
