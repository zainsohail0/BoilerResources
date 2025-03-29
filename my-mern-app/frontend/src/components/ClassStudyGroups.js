
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ClassStudyGroups = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studyGroups, setStudyGroups] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinStatus, setJoinStatus] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [mockMode, setMockMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if we have class details from navigation state
  useEffect(() => {
    if (location.state?.classDetails) {
      setClassDetails(location.state.classDetails);
    }
  }, [location.state]);

  // Get user data first
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check if we have a cached user in state or sessionStorage
        const cachedUser = sessionStorage.getItem('currentUser');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setCurrentUser(userData);
          return;
        }

        // Get token from localStorage
        const token = localStorage.getItem('token');
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Try to fetch current user
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers,
          credentials: "include"
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          console.log("User data fetched:", userData);
          setCurrentUser(userData);
          
          // Cache the user data
          sessionStorage.setItem('currentUser', JSON.stringify(userData));
          
          // Also store the user ID specifically for easier access
          localStorage.setItem('userId', userData._id);
          sessionStorage.setItem('userId', userData._id);
        } else {
          console.log("Could not fetch user, checking localStorage");
          // Try to get user ID from localStorage or session
          const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
          
          if (userId) {
            setCurrentUser({ _id: userId });
          } else {
            console.warn("No user ID found in storage");
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        // Wait for user data to be loaded first
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get user ID
        const userId = currentUser._id || localStorage.getItem('userId') || sessionStorage.getItem('userId');
        console.log("Using user ID:", userId);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Fetch class details if we don't already have them
        if (!classDetails) {
          try {
            const classRes = await fetch(`${API_URL}/api/courses/${classId}`, {
              headers,
              credentials: "include"
            });

            if (classRes.ok) {
              const classData = await classRes.json();
              console.log("Class details fetched:", classData);
              setClassDetails(classData);
            } else {
              console.log("Failed to fetch class details, using dummy data");
              // Generate dummy class data
              setClassDetails({
                _id: classId,
                courseCode: "Course " + classId.substring(0, 4),
                title: "Class title unavailable"
              });
            }
          } catch (classError) {
            console.error("Error fetching class details:", classError);
            // Generate dummy class data
            setClassDetails({
              _id: classId,
              courseCode: "Course " + classId.substring(0, 4),
              title: "Class title unavailable"
            });
          }
        }

        // Try the /groups/class endpoint first
        try {
          console.log(`Trying endpoint: /api/groups/class/${classId}`);
          const groupsRes = await fetch(`${API_URL}/api/groups/class/${classId}`, {
            headers,
            credentials: "include"
          });
          
          if (groupsRes.ok) {
            const groupsData = await groupsRes.json();
            console.log("Study groups data:", groupsData);
            
            if (Array.isArray(groupsData) && groupsData.length > 0) {
              processGroupsData(groupsData, userId);
              return;
            }
          } else {
            const errorText = await groupsRes.text();
            console.error("Study groups API error:", errorText);
          }
        } catch (endpoint1Error) {
          console.error("Endpoint 1 error:", endpoint1Error);
        }

        // Try using groups for current user, filtered by class
        try {
          if (userId) {
            console.log(`Trying endpoint: /api/groups/user/${userId}`);
            const userGroupsRes = await fetch(`${API_URL}/api/groups/user/${userId}`, {
              headers,
              credentials: "include"
            });
            
            if (userGroupsRes.ok) {
              const userGroupsData = await userGroupsRes.json();
              console.log("User's groups:", userGroupsData);
              
              if (Array.isArray(userGroupsData)) {
                // Filter for this class
                const filteredGroups = userGroupsData.filter(group => group.classId === classId);
                console.log("Filtered user groups for class:", filteredGroups);
                
                if (filteredGroups.length > 0) {
                  processGroupsData(filteredGroups, userId);
                  return;
                }
              }
            }
          }
        } catch (endpoint2Error) {
          console.error("Endpoint 2 error:", endpoint2Error);
        }
        
        // Try just getting all groups
        try {
          console.log("Trying to get all groups");
          const allGroupsRes = await fetch(`${API_URL}/api/groups`, {
            headers,
            credentials: "include"
          });
          
          if (allGroupsRes.ok) {
            const allGroupsData = await allGroupsRes.json();
            console.log("All groups:", allGroupsData);
            
            if (Array.isArray(allGroupsData)) {
              // Filter for this class
              const filteredGroups = allGroupsData.filter(group => group.classId === classId);
              console.log("Filtered all groups for class:", filteredGroups);
              
              if (filteredGroups.length > 0) {
                processGroupsData(filteredGroups, userId);
                return;
              }
            }
          }
        } catch (endpoint3Error) {
          console.error("Endpoint 3 error:", endpoint3Error);
        }
        
        // Last resort - check localStorage for created groups
        try {
          const createdGroups = JSON.parse(localStorage.getItem('createdStudyGroups') || '[]');
          console.log("Created groups from localStorage:", createdGroups);
          
          if (Array.isArray(createdGroups) && createdGroups.length > 0) {
            // Filter for this class
            const filteredGroups = createdGroups.filter(group => group.classId === classId);
            console.log("Filtered local groups for class:", filteredGroups);
            
            if (filteredGroups.length > 0) {
              processGroupsData(filteredGroups, userId);
              return;
            }
          }
        } catch (localStorageError) {
          console.error("LocalStorage error:", localStorageError);
        }
        
        // All attempts failed - show empty state
        setMockMode(true);
        setError("Failed to fetch study groups. Please try again later.");
        setStudyGroups([]);
        
      } catch (err) {
        console.error("❌ Main error:", err);
        setError("Failed to fetch study groups. Please try again later.");
        setStudyGroups([]);
        setMockMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId, classDetails, currentUser]);

  const processGroupsData = (groups, userId) => {
    setStudyGroups(groups);
    
    // Initialize join status for all groups
    const statusMap = {};
    groups.forEach(group => {
      statusMap[group._id] = {
        isAdmin: group.isAdmin || (group.adminId === userId),
        isMember: group.isMember || (group.members && group.members.includes(userId)),
        hasJoinRequest: group.hasJoinRequest || (group.joinRequests && group.joinRequests.some(req => req.userId === userId))
      };
    });
    setJoinStatus(statusMap);
    setMockMode(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      // If search is empty, just reset to all groups
      navigate(0); // Refresh the page to reset
      return;
    }
    
    // Perform client-side filtering
    const filtered = studyGroups.filter(group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setStudyGroups(filtered);
  };

  const handleJoinGroup = async (groupId, isPrivate) => {
    try {
      if (!currentUser || !currentUser._id) {
        // If no user ID is found, show a more helpful message
        const newNotification = {
          id: Date.now(),
          message: "Unable to find your user ID. This may be a temporary issue. Try refreshing the page or logging out and back in.",
          type: "error"
        };
        setNotifications([...notifications, newNotification]);
        return;
      }
      
      const userId = currentUser._id;
      console.log("Joining with user ID:", userId);
      
      if (mockMode) {
        // In mock mode, simulate joining
        const newNotification = {
          id: Date.now(),
          message: isPrivate 
            ? "Join request sent (mock mode)" 
            : "You've joined the group (mock mode)",
          type: isPrivate ? "info" : "success"
        };
        setNotifications([...notifications, newNotification]);
        
        // Update join status
        setJoinStatus(prev => ({
          ...prev,
          [groupId]: {
            ...prev[groupId],
            isMember: !isPrivate,
            hasJoinRequest: isPrivate
          }
        }));
        
        // Update the group in the list
        setStudyGroups(prev => 
          prev.map(group => 
            group._id === groupId 
              ? { 
                  ...group, 
                  isMember: !isPrivate,
                  hasJoinRequest: isPrivate,
                  memberCount: !isPrivate ? (group.memberCount || 0) + 1 : group.memberCount
                } 
              : group
          )
        );
        return;
      }
      
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      console.log(`Attempting to join group ${groupId} (private: ${isPrivate})`);
      const response = await fetch(`${API_URL}/api/groups/${groupId}/join`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ userId })
      });
      
      let result;
      try {
        const responseText = await response.text();
        console.log("Join response:", response.status, responseText);
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response:", e);
        // Assume success based on response status
        result = {
          message: isPrivate 
            ? "Join request sent successfully" 
            : "You've joined the group successfully",
          joined: !isPrivate,
          pending: isPrivate
        };
      }
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to join group");
      }
      
      // Add notification
      const newNotification = {
        id: Date.now(),
        message: result.message || (result.joined ? "Successfully joined group" : "Join request sent"),
        type: result.joined ? "success" : "info"
      };
      setNotifications([...notifications, newNotification]);
      
      // Update join status for this group
      setJoinStatus(prev => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          isMember: result.joined,
          hasJoinRequest: result.pending
        }
      }));
      
      // Update the group in the list
      setStudyGroups(prev => 
        prev.map(group => 
          group._id === groupId 
            ? { 
                ...group, 
                isMember: result.joined,
                hasJoinRequest: result.pending,
                memberCount: result.joined ? (group.memberCount || 0) + 1 : group.memberCount
              } 
            : group
        )
      );
      
    } catch (err) {
      console.error("❌ Join error:", err);
      const newNotification = {
        id: Date.now(),
        message: err.message || "Failed to join group",
        type: "error"
      };
      setNotifications([...notifications, newNotification]);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const handleCreateGroup = () => {
    if (classDetails) {
      navigate(`/create-study-group?classId=${classId}`, {
        state: { classDetails }
      });
    } else {
      navigate(`/create-study-group?classId=${classId}`);
    }
  };

  const renderJoinButton = (group) => {
    const status = joinStatus[group._id];
    
    if (!status) return null;
    
    if (status.isAdmin) {
      return (
        <div className="text-gray-600 dark:text-gray-400">
          You are the admin
        </div>
      );
    }
    
    if (status.isMember) {
      return (
        <div className="text-green-600 dark:text-green-400">
          You are a member
        </div>
      );
    }
    
    if (status.hasJoinRequest) {
      return (
        <div className="text-yellow-600 dark:text-yellow-400">
          Join request pending
        </div>
      );
    }
    
    return (
      <button
        onClick={() => handleJoinGroup(group._id, group.isPrivate)}
        className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white rounded"
      >
        {group.isPrivate ? "Request to Join" : "Join Group"}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
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
              <span className="text-white text-xl font-bold">Boiler Resources</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/home')}
                className="text-white hover:text-gray-300 mr-4"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-3 rounded shadow-md ${
              notification.type === 'error' ? 'bg-red-100 text-red-800' :
              notification.type === 'success' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>{notification.message}</div>
              <button 
                onClick={() => dismissNotification(notification.id)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Study Groups for {classDetails?.courseCode || "Class"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {classDetails?.title || "Loading class details..."}
              </p>
              {currentUser && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Logged in as: {currentUser.username || currentUser.email || currentUser._id}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white rounded"
              >
                Create New Study Group
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
              <p className="text-sm mt-1">
                You can still create a new study group for this class by clicking the button above.
              </p>
            </div>
          )}

          {mockMode && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              <strong>Notice:</strong> Operating in fallback mode. Some features may be limited.
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search study groups..."
                className="flex-1 shadow appearance-none border rounded-l py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                type="submit"
                className="bg-yellow-700 hover:bg-yellow-800 text-white py-2 px-4 rounded-r"
              >
                Search
              </button>
            </form>
          </div>

          {/* Study Groups List */}
          {studyGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No study groups found for this class.</p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Be the first to create a study group for this class!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {studyGroups.map(group => (
                <div key={group._id} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                      {group.isPrivate && (
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Members: {group.memberCount || (group.members && group.members.length) || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Admin: {joinStatus[group._id]?.isAdmin ? 'You' : 'Another user'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="text-yellow-700 dark:text-yellow-500 hover:underline"
                    >
                      View Details
                    </button>
                    {renderJoinButton(group)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassStudyGroups;