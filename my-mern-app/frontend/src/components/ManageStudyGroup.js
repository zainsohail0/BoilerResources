import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ManageStudyGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    isPrivate: false,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (!userRes.ok) {
          throw new Error("Authentication failed");
        }

        const userData = await userRes.json();
        setUser(userData);

        // Fetch group details
        const groupRes = await fetch(`${API_URL}/api/groups/${id}`, {
          credentials: "include",
        });

        if (!groupRes.ok) {
          throw new Error("Failed to fetch study group");
        }

        const groupData = await groupRes.json();
        setGroup(groupData);
        
        // Only admin can manage group
        if (groupData.adminId !== userData._id) {
          throw new Error("You don't have permission to manage this group");
        }

        // Set form data
        setFormData({
          name: groupData.name,
          isPrivate: groupData.isPrivate,
        });

        // Fetch member details
        const membersRes = await fetch(`${API_URL}/api/groups/${id}/members`, {
          credentials: "include",
        });

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        }

        // Fetch join requests
        const requestsRes = await fetch(`${API_URL}/api/groups/${id}/join-requests`, {
          credentials: "include",
        });

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setJoinRequests(requestsData);
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.message);
        
        if (err.message === "Authentication failed") {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    // Check if the value is actually different from the original group data
    const isChanged = type === "checkbox" 
      ? newValue !== group.isPrivate
      : newValue !== group.name;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // If this field changed, set hasUnsavedChanges to true
    if (isChanged) {
      setHasUnsavedChanges(true);
    } else {
      // Check if other fields are different from original
      const otherFieldChanged = name === "name" 
        ? formData.isPrivate !== group.isPrivate
        : formData.name !== group.name;
      
      setHasUnsavedChanges(otherFieldChanged);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    
    // Validate form
    if (!formData.name.trim()) {
      setError("Group name is required");
      setIsSaving(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          isPrivate: formData.isPrivate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update study group");
      }

      // Update local group data
      setGroup(prev => ({
        ...prev,
        name: formData.name,
        isPrivate: formData.isPrivate,
      }));
      
      setSuccess("Study group settings saved successfully!");
      setHasUnsavedChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error updating study group:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to delete this study group? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete study group");
      }

      setSuccess("Study group deleted successfully!");
      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (err) {
      console.error("❌ Error deleting study group:", err);
      setError(err.message);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/approve-request/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve request");
      }

      // Update join requests and members
      const updatedRequests = joinRequests.filter(req => req._id !== requestId);
      setJoinRequests(updatedRequests);
      
      // Fetch updated members
      const membersRes = await fetch(`${API_URL}/api/groups/${id}/members`, {
        credentials: "include",
      });

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
      
      setSuccess("Join request approved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error approving request:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/reject-request/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
      }

      // Update join requests
      const updatedRequests = joinRequests.filter(req => req._id !== requestId);
      setJoinRequests(updatedRequests);
      
      setSuccess("Join request rejected successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (memberId === user._id) {
      setError("You cannot remove yourself from the group. If you want to leave, delete the group or transfer ownership.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/remove-member/${memberId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove member");
      }

      // Update members list
      const updatedMembers = members.filter(member => member._id !== memberId);
      setMembers(updatedMembers);
      
      setSuccess("Member removed successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("❌ Error removing member:", err);
      setError(err.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="mt-4 bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-800"
          >
            Back to Dashboard
          </button>
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
                onClick={() => navigate(`/study-group/${id}`)}
                className="text-white hover:text-gray-300"
              >
                View Group
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-white hover:text-gray-300"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Manage Study Group: {group?.name}
          </h1>
          
          {/* Group Settings Section with Clear Title */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Group Settings</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                  Group Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-gray-700 dark:text-gray-300" htmlFor="isPrivate">
                    Make this group private (only visible to invited members)
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  Private groups require admin approval for new members to join
                </p>
              </div>

              <div className="flex items-center justify-between">
                {/* Save Button - Always visible but with different styles based on state */}
                <button
                  type="submit"
                  disabled={isSaving || !hasUnsavedChanges}
                  className={
                    hasUnsavedChanges 
                      ? `bg-brown-600 hover:bg-brown-700 text-white font-bold py-2 px-6 rounded ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`
                      : "bg-gray-400 text-white font-bold py-2 px-6 rounded cursor-not-allowed"
                  }
                  style={{ 
                    minWidth: '140px',
                    backgroundColor: hasUnsavedChanges ? '#8B4513' : '#9CA3AF' // Brown color when active, gray when disabled
                  }}
                >
                  {isSaving ? "Saving..." : (hasUnsavedChanges ? "Save Changes" : "No Changes")}
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Delete Group
                </button>
              </div>
              
              {hasUnsavedChanges && (
                <p className="text-sm text-yellow-600 mt-2">
                  You have unsaved changes. Click "Save Changes" to apply them.
                </p>
              )}
            </form>
          </div>

          {/* Join Requests Section */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Join Requests</h2>
            
            {joinRequests.length > 0 ? (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-4 border rounded bg-gray-50 dark:bg-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {request.user ? request.user.username || request.user.email : 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Requested: {new Date(request.requestedAt).toLocaleString()}
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
                        onClick={() => handleRejectRequest(request._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No pending join requests.</p>
            )}
          </div>

          {/* Members Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Members</h2>
            
            {members.length > 0 ? (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-4 border rounded bg-gray-50 dark:bg-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {member.username || member.email || 'Unknown User'}
                        {member._id === group.adminId && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                            Admin (You)
                          </span>
                        )}
                      </p>
                    </div>
                    {member._id !== group.adminId && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
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

export default ManageStudyGroup;