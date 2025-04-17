import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const GroupView = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasRequestedJoin, setHasRequestedJoin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // First get current user details
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        
        if (!userResponse.ok) {
          throw new Error("Failed to fetch current user details");
        }
        
        const userData = await userResponse.json();
        const userId = userData._id;
        setCurrentUserId(userId);
        
        // Fetch group details
        console.log(`Fetching group ${groupId} details`);
        const groupRes = await fetch(`${API_URL}/api/groups/${groupId}`, {
          credentials: "include"
        });
        
        if (!groupRes.ok) {
          const groupError = await groupRes.text();
          console.error("Error fetching group:", groupError);
          throw new Error("Failed to fetch group details");
        }
        
        const groupData = await groupRes.json();
        console.log("Group data:", groupData);
        setGroup(groupData);
        
        // Check if current user is the admin
        setIsAdmin(groupData.adminId === userId);
        
        // Check if current user is a member
        setIsMember(
          Array.isArray(groupData.members) && 
          groupData.members.some(member => {
            if (typeof member === 'object' && member !== null) {
              return member._id === userId;
            }
            return member === userId;
          })
        );
        
        // Check if user has a pending join request
        setHasRequestedJoin(
          Array.isArray(groupData.joinRequests) && 
          groupData.joinRequests.some(request => {
            if (typeof request === 'object' && request !== null) {
              if (request.userId) {
                if (typeof request.userId === 'object') {
                  return request.userId._id === userId;
                }
                return request.userId === userId;
              }
              if (request.user) {
                if (typeof request.user === 'object') {
                  return request.user._id === userId;
                }
                return request.user === userId;
              }
            }
            return false;
          })
        );
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);
  
  const handleJoinRequest = async () => {
    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send join request: ${errorText}`);
      }
      
      setSuccess("Join request sent successfully!");
      setHasRequestedJoin(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error sending join request:", err);
      setError(err.message);
    }
  };
  
  const handleLeaveGroup = async () => {
    try {
      setError(null);
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to leave group: ${errorText}`);
      }
      
      setSuccess("You have left the group successfully");
      setIsMember(false);
      
      // Redirect to groups list after 2 seconds
      setTimeout(() => {
        navigate("/groups");
      }, 2000);
    } catch (err) {
      console.error("❌ Error leaving group:", err);
      setError(err.message);
    }
  };
  
  const handleManageJoinRequests = () => {
    navigate(`/groups/${groupId}/join-requests`);
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/groups")}
                className="text-white hover:text-gray-300"
              >
                Back to Groups
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {group?.name || "Loading group details..."}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {group?.isPrivate ? "Private Group" : "Public Group"} • {group?.members?.length || 0} members
              </p>
            </div>
            
            {/* Group Actions */}
            <div>
              {isAdmin && (
                <div className="flex flex-col space-y-2">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium inline-block text-center">
                    You are the Admin
                  </span>
                  <button
                    onClick={handleManageJoinRequests}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Manage Join Requests
                  </button>
                </div>
              )}
              
              {!isAdmin && isMember && (
                <button
                  onClick={handleLeaveGroup}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Leave Group
                </button>
              )}
              
              {!isAdmin && !isMember && !hasRequestedJoin && (
                <button
                  onClick={handleJoinRequest}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {group?.isPrivate ? "Request to Join" : "Join Group"}
                </button>
              )}
              
              {!isAdmin && !isMember && hasRequestedJoin && (
                <span className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-sm font-medium inline-block">
                  Join Request Pending
                </span>
              )}
            </div>
          </div>
          
          {/* Debug Info (only visible during development) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 text-xs font-mono overflow-auto rounded">
              <details>
                <summary className="cursor-pointer font-bold">Debug Info (click to expand)</summary>
                <div className="mt-2">
                  <p>Group ID: {groupId}</p>
                  <p>Current User ID: {currentUserId}</p>
                  <p>Admin ID: {group?.adminId}</p>
                  <p>Is admin: {isAdmin ? 'Yes' : 'No'}</p>
                  <p>Is member: {isMember ? 'Yes' : 'No'}</p>
                  <p>Has requested join: {hasRequestedJoin ? 'Yes' : 'No'}</p>
                </div>
              </details>
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>Success!</strong> {success}
            </div>
          )}
          
          {/* Group Details Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Group Details</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="mb-2">
                <span className="font-medium">Created by:</span> {group?.adminName || "Unknown"}
              </p>
              
              <p className="mb-2">
                <span className="font-medium">Class:</span> {group?.className || "N/A"}
              </p>
              
              <p>
                <span className="font-medium">Description:</span> {group?.description || "No description available."}
              </p>
            </div>
          </div>
          
          {/* Members Section */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Members</h2>
            
            {group?.members && group.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.members.map((member, index) => (
                  <div 
                    key={member._id || `member-${index}`}
                    className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      {member.username ? member.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">
                        {typeof member === 'object' ? 
                          (member.username || member.email || "Unknown User") : 
                          "User " + (index + 1)}
                      </p>
                      {group.adminId === (typeof member === 'object' ? member._id : member) && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No members found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupView;