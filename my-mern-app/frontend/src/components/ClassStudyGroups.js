import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ClassStudyGroups = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [studyGroups, setStudyGroups] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token and user ID
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        setCurrentUserId(userId);
        
        if (!userId) {
          setError("You must be logged in to view study groups");
          setLoading(false);
          return;
        }
        
        // Set headers for requests
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        if (userId) {
          headers["X-User-ID"] = userId; 
        }
        
        // Fetch class details
        const classRes = await fetch(`${API_URL}/api/courses/${classId}`, {
          headers,
          credentials: "include"
        });
        
        if (!classRes.ok) {
          throw new Error("Failed to fetch class details");
        }
        
        const classData = await classRes.json();
        setClassDetails(classData);
        
        // Fetch study groups for this class
        const groupsRes = await fetch(`${API_URL}/api/groups/class/${classId}`, {
          headers,
          credentials: "include"
        });
        
        if (!groupsRes.ok) {
          throw new Error("Failed to fetch study groups");
        }
        
        const groupsData = await groupsRes.json();
        setStudyGroups(groupsData);
        
        // For each group, fetch user status
        const statusesObj = {};
        
        for (const group of groupsData) {
          try {
            const statusRes = await fetch(`${API_URL}/api/groups/${group._id}/user-status`, {
              headers,
              credentials: "include"
            });
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              statusesObj[group._id] = statusData;
            } else {
              console.error(`Failed to fetch status for group ${group._id}`);
              statusesObj[group._id] = {
                isAdmin: false,
                isMember: false,
                hasPendingRequest: false,
                status: 'none'
              };
            }
          } catch (error) {
            console.error(`Error fetching status for group ${group._id}:`, error);
            statusesObj[group._id] = {
              isAdmin: false,
              isMember: false,
              hasPendingRequest: false,
              status: 'none'
            };
          }
        }
        
        setUserStatuses(statusesObj);
        
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [classId]);
  
  const handleJoinGroup = async (groupId, isPrivate) => {
    try {
      setError(null);
      
      // Get auth token and user ID
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError("You must be logged in to join a group");
        return;
      }
      
      // Set headers for request
      const headers = {
        "Content-Type": "application/json",
        "X-User-ID": userId
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Call the endpoint based on whether the group is private or public
      const endpoint = isPrivate ? 
        `${API_URL}/api/groups/${groupId}/join-request` : 
        `${API_URL}/api/groups/${groupId}/join`;
      
        const response = await fetch(`${API_URL}/api/groups/${groupId}/join`, {
          method: "POST",
          headers,
          credentials: "include"
        });
      
      let result;
      
      try {
        result = await response.json();
      } catch (e) {
        // If not JSON, get text
        const text = await response.text();
        result = { message: text };
      }
      
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isPrivate ? 'request to join' : 'join'} group`);
      }
      
      // Show success message
      setSuccessMessage(result.message || `You've ${isPrivate ? 'requested to join' : 'joined'} the group successfully`);
      
      // Update the local state to reflect the change
      setUserStatuses(prev => ({
        ...prev,
        [groupId]: {
          isAdmin: false,
          isMember: !isPrivate,
          hasPendingRequest: isPrivate,
          status: isPrivate ? 'pending' : 'member'
        }
      }));
      
      // Navigate back to home after a delay
      setTimeout(() => {
        navigate('/home', { state: { refreshGroups: true } });
      }, 2000);
      
    } catch (err) {
      console.error("Error joining group:", err);
      setError(err.message);
    }
  };
  
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  if (loading) {
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
      
      {/* Success Message (if any) */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 py-2 mt-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex justify-between">
              <div>
                <strong>Success!</strong> {successMessage}
              </div>
              <button onClick={clearMessages} className="text-green-700">
                &times;
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message (if any) */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-2 mt-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between">
              <div>
                <strong>Error:</strong> {error}
              </div>
              <button onClick={clearMessages} className="text-red-700">
                &times;
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Study Groups for {classDetails?.courseCode}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {classDetails?.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Logged in as: {currentUserId}
              </p>
            </div>
            <button
              onClick={() => navigate(`/create-study-group?classId=${classId}`)}
              className="bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-800"
            >
              Create New Study Group
            </button>
          </div>
        </div>
        
        {/* Study Groups List */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Available Study Groups</h2>
          
          {studyGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => {
                const userStatus = userStatuses[group._id] || {
                  isAdmin: false,
                  isMember: false,
                  hasPendingRequest: false,
                  status: 'none'
                };
                
                const isAdmin = userStatus.isAdmin;
                const isMember = userStatus.isMember;
                const hasPendingRequest = userStatus.hasPendingRequest;
                
                return (
                  <div key={group._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{group.name}</h3>
                    <div className="flex items-center mt-1 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${group.isPrivate ? "bg-gray-200 text-gray-800" : "bg-green-200 text-green-800"}`}>
                        {group.isPrivate ? "Private Group" : "Public Group"}
                      </span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {group.members?.length || 0} members
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">
                      Admin: {group.adminId === currentUserId ? 'You' : 'Another user'}
                    </p>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        onClick={() => navigate(`/groups/${group._id}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                      
                      {/* Join button logic based on user status */}
                      {isAdmin ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                          You are the Admin
                        </span>
                      ) : isMember ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                          Already a Member
                        </span>
                      ) : hasPendingRequest ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
                          Request Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(group._id, group.isPrivate)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          {group.isPrivate ? "Request to Join" : "Join Group"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-gray-600 dark:text-gray-400">
                No study groups available for this class yet. Be the first to create one!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassStudyGroups;