import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ManageJoinRequests = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

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
        const userIsAdmin = groupData.adminId === userId;
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
          setError("You don't have permission to manage join requests for this group");
          setJoinRequests([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch join requests
        console.log(`Fetching join requests for group ${groupId}`);
        const requestsRes = await fetch(`${API_URL}/api/groups/${groupId}/join-requests`, {
          credentials: "include"
        });
        
        if (!requestsRes.ok) {
          const errorText = await requestsRes.text();
          console.error("Failed to fetch join requests:", errorText);
          
          // Since the API failed, let's try to get join requests directly from the group data
          if (groupData.joinRequests && Array.isArray(groupData.joinRequests) && groupData.joinRequests.length > 0) {
            console.log("Using join requests from group data:", groupData.joinRequests);
            setJoinRequests(groupData.joinRequests);
            setError("Using cached join requests (API request failed)");
          } else {
            setJoinRequests([]);
            setError("Failed to fetch join requests. This could be a temporary issue or there might be no pending requests.");
          }
        } else {
          // Successfully fetched join requests from API
          const requestsData = await requestsRes.json();
          console.log("Join requests fetched:", requestsData);
          setJoinRequests(requestsData);
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);
  
  const handleApproveRequest = async (requestId) => {
    try {
      console.log(`Approving request ${requestId} for group ${groupId}`);
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/approve-request/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ 
          requestId: requestId
        })
      });
      
      const responseText = await response.text();
      console.log("Approve response:", response.status, responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to approve request: ${responseText}`);
      }
      
      // Remove the approved request from the list
      setJoinRequests(joinRequests.filter(request => request._id !== requestId));
      
      setSuccess("Join request approved successfully.");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error approving request:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const openRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectReason("");
    setShowRejectModal(true);
  };
  
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequestId(null);
  };
  
  const handleRejectRequest = async () => {
    try {
      console.log(`Rejecting request ${selectedRequestId} for group ${groupId}`);
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/reject-request/${selectedRequestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ 
          reason: rejectReason,
          requestId: selectedRequestId
        })
      });
      
      const responseText = await response.text();
      console.log("Reject response:", response.status, responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to reject request: ${responseText}`);
      }
      
      // Remove the rejected request from the list
      setJoinRequests(joinRequests.filter(request => request._id !== selectedRequestId));
      
      setSuccess("Join request rejected successfully.");
      closeRejectModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      setError(err.message);
      closeRejectModal();
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }
  
  // If user is not the admin, show unauthorized message
  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
        <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-white text-xl font-bold">Boiler Resources</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/groups/${groupId}`)}
                  className="text-white hover:text-gray-300"
                >
                  Back to Group
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Unauthorized
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">
              You don't have permission to manage join requests for this group. Only group admins can manage join requests.
            </p>
            <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Return to Group
            </button>
          </div>
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
              <span className="text-white text-xl font-bold">Boiler Resources</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/groups/${groupId}`)}
                className="text-white hover:text-gray-300"
              >
                Back to Group
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Manage Join Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {group?.name || "Loading group details..."}
          </p>
          
          {/* Debug Info (only visible during development) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 text-xs font-mono overflow-auto rounded">
              <details>
                <summary className="cursor-pointer font-bold">Debug Info (click to expand)</summary>
                <div className="mt-2">
                  <p>Group ID: {groupId}</p>
                  <p>User ID: {currentUserId}</p>
                  <p>Admin ID: {group?.adminId}</p>
                  <p>Is admin: {isAdmin ? 'Yes' : 'No'}</p>
                  <p>Join requests count: {joinRequests?.length || 0}</p>
                </div>
              </details>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <strong>Success!</strong> {success}
            </div>
          )}
          
          {joinRequests.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No pending join requests.</p>
              {group && !group.isPrivate && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  This group is public, so users can join directly without approval.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request._id || `req-${Date.now()}-${Math.random()}`} className="flex items-center justify-between p-4 border rounded bg-gray-50 dark:bg-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {request.user 
                        ? (request.user.username || request.user.email || 'Unknown User')
                        : (request.userId && typeof request.userId === 'object')
                          ? (request.userId.username || request.userId.email || 'Unknown User') 
                          : 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Requested: {formatDate(request.requestedAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveRequest(request._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(request._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Reject Join Request
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Optionally provide a reason why you're rejecting this request. The user will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full p-2 border rounded mb-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJoinRequests;