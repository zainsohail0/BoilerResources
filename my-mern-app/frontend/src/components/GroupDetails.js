import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PendingJoinRequests from "./PendingJoinRequests";

const API_URL = "http://localhost:5001";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [userStatus, setUserStatus] = useState({
    status: 'none',
    isAdmin: false,
    isMember: false,
    hasPendingRequest: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  
  // Function to fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      console.log("Current user ID:", userId);
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      if (userId) {
        headers["X-User-ID"] = userId;
      }
      
      // Fetch group details
      const groupRes = await fetch(`${API_URL}/api/groups/${groupId}`, {
        headers,
        credentials: "include"
      });
      
      if (!groupRes.ok) {
        throw new Error("Failed to fetch group details");
      }
      
      const groupData = await groupRes.json();
      console.log("Group data:", groupData);
      setGroup(groupData);
      
      // Fetch members
      const membersRes = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
        headers,
        credentials: "include"
      });
      
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
      
      // Check user's status in the group using the API instead of client-side validation
      try {
        const statusRes = await fetch(`${API_URL}/api/groups/${groupId}/user-status`, {
          headers,
          credentials: "include"
        });
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          console.log("User status data:", statusData);
          setUserStatus(statusData);
        } else {
          console.error("Failed to fetch user status:", await statusRes.text());
          // Default to non-member if status check fails
          setUserStatus({
            status: 'none',
            isAdmin: false,
            isMember: false,
            hasPendingRequest: false
          });
        }
      } catch (statusErr) {
        console.error("Error fetching user status:", statusErr);
        // Default to non-member if status check errors
        setUserStatus({
          status: 'none',
          isAdmin: false,
          isMember: false,
          hasPendingRequest: false
        });
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllData();
  }, [groupId, joinRequestSent]);
  
  const handleJoinGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      if (userId) {
        headers["X-User-ID"] = userId;
      }
      
      console.log(`Attempting to join group ${groupId}`);
      const response = await fetch(`${API_URL}/api/groups/${groupId}/join-request`, {
        method: "POST",
        headers,
        credentials: "include"
      });
      
      // Get both text and status for better debugging
      const responseText = await response.text();
      console.log("Join response:", response.status, responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        result = { 
          message: responseText || "Request processed but no details available",
          joined: !group.isPrivate, // Assume joined directly if public
          pending: group.isPrivate  // Assume pending if private
        };
      }
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to join group");
      }
      
      setSuccess(result.message);
      setJoinRequestSent(true);
      
      // Update user status based on response
      setUserStatus(prev => ({
        ...prev,
        status: result.joined ? 'member' : (result.pending ? 'pending' : prev.status),
        isMember: result.joined,
        hasPendingRequest: result.pending
      }));
      
      // If joined successfully, reload members list
      if (result.joined) {
        const membersRes = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
          headers,
          credentials: "include"
        });
        
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Join error:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      if (userId) {
        headers["X-User-ID"] = userId;
      }
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/leave`, {
        method: "POST",
        headers,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to leave group");
      }
      
      const result = await response.json();
      
      setSuccess(result.message);
      
      // Update user status
      setUserStatus(prev => ({
        ...prev,
        status: 'none',
        isMember: false,
        hasPendingRequest: false
      }));
      
      // Remove user from members list
      setMembers(members.filter(member => member._id !== userId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Leave error:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleViewChat = () => {
    // Navigate to the chat page for this group
    navigate(`/group-chat/${groupId}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-red-600 dark:text-red-400">Group not found</div>
      </div>
    );
  }
  
  // Use only the server-provided user status for rendering
  // Don't override with client-side logic
  const isUserAdmin = userStatus.isAdmin;
  const isUserMember = userStatus.isMember;
  const hasVisiblePendingRequest = userStatus.hasPendingRequest || joinRequestSent;
  
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
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Group Info */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {group.class ? `${group.class.courseCode} - ${group.class.title}` : 'Unknown Class'}
                  </p>
                </div>
                <div className="flex items-center">
                  {group.isPrivate && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded mr-2">
                      Private
                    </span>
                  )}
                  {isUserAdmin && (
                    <span className="bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
                  <strong>Success!</strong> {success}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-2">
                {isUserAdmin && (
                  <button
                    onClick={() => navigate(`/groups/${groupId}/requests`)}
                    className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white rounded"
                  >
                    Manage Join Requests
                  </button>
                )}
                
                {(isUserMember || isUserAdmin) && (
                  <button
                    onClick={handleViewChat}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    View Chat
                  </button>
                )}
                
                {isUserMember && !isUserAdmin && (
                  <button
                    onClick={handleLeaveGroup}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Leave Group
                  </button>
                )}
                
                {!isUserMember && !hasVisiblePendingRequest && !isUserAdmin && (
                  <button
                    onClick={handleJoinGroup}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {group.isPrivate ? "Request to Join" : "Join Group"}
                  </button>
                )}
                
                {hasVisiblePendingRequest && (
                  <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded">
                    Join Request Pending
                  </div>
                )}
              </div>
              
              {/* Members List */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Members ({members.length})
                </h2>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        {isUserAdmin && (
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {members.map(member => (
                        <tr key={member._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {member.username || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {member.email || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${member._id === group.adminId ? 
                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' : 
                                'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'}`}>
                              {member._id === group.adminId ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          {isUserAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {member._id !== group.adminId && (
                                <button
                                  onClick={() => {
                                    // Handle remove member
                                    // This would be implemented with an API call
                                    console.log("Remove member:", member._id);
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Pending Requests */}
          <div>
            {hasVisiblePendingRequest && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Your Request Status
                </h2>
                <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-4 rounded">
                  <p className="text-yellow-800 dark:text-yellow-300">
                    Your request to join this group is pending approval from the admin.
                  </p>
                </div>
              </div>
            )}
            
            {/* Render pending join requests */}
            {!isUserAdmin && <PendingJoinRequests key={joinRequestSent ? "updated" : "initial"} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;