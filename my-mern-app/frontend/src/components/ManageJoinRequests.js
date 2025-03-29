
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
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
        setGroup(groupData);
        
        // Fetch join requests
        const requestsRes = await fetch(`${API_URL}/api/groups/${groupId}/join-requests`, {
          headers,
          credentials: "include"
        });
        
        if (!requestsRes.ok) {
          throw new Error("Failed to fetch join requests");
        }
        
        const requestsData = await requestsRes.json();
        setJoinRequests(requestsData);
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
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/approve-request/${requestId}`, {
        method: "POST",
        headers,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve request");
      }
      
      // Remove the approved request from the list
      setJoinRequests(joinRequests.filter(request => request._id !== requestId));
      
      setSuccess("Join request approved successfully. The user has been added to the group.");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error approving request:", err);
      setError(err.message);
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
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/reject-request/${selectedRequestId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: rejectReason }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
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
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
                onClick={() => navigate(`/groups/${groupId}`)}
                className="text-white hover:text-gray-300 mr-4"
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
            {group?.name}
          </p>
          
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Requested At</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map(request => (
                    <tr key={request._id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4">
                        {request.user ? (
                          <div>
                            <div className="font-medium">{request.user.username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{request.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Unknown User</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(request._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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