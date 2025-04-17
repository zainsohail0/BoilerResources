import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const StudyGroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [joinRequestSent, setJoinRequestSent] = useState(false);

  useEffect(() => {
    const fetchUserAndGroup = async () => {
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

        // Log the response status for debugging
        console.log(`Fetching group ${id}, status: ${groupRes.status}`);
        
        if (!groupRes.ok) {
          // Get the error text for better debugging
          const errorText = await groupRes.text();
          console.error("Group fetch error response:", errorText);
          throw new Error("Failed to fetch study group");
        }

        const groupData = await groupRes.json();
        console.log("Fetched group data:", groupData);
        
        setGroup(groupData);
        
        // Check if user is admin or member
        setIsAdmin(groupData.adminId === userData._id);
        setIsMember(groupData.members.includes(userData._id));
        setJoinRequestSent(groupData.joinRequests.some(req => req.userId === userData._id));

        // Fetch class details if group has classId
        if (groupData.classId) {
          const classRes = await fetch(`${API_URL}/api/courses/${groupData.classId}`, {
            credentials: "include",
          });

          if (classRes.ok) {
            const classData = await classRes.json();
            setClassDetails(classData);
          } else {
            console.error("Failed to fetch class details");
          }
        }

        // Fetch member details
        const membersRes = await fetch(`${API_URL}/api/groups/${id}/members`, {
          credentials: "include",
        });

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        } else {
          console.error("Failed to fetch group members");
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

    fetchUserAndGroup();
  }, [id, navigate]);

  const handleJoinRequest = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/join-request`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send join request");
      }

      setSuccess("Join request sent successfully!");
      setJoinRequestSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this study group?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/leave`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to leave group");
      }

      setSuccess("You have left the study group");
      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (error) {
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Study Group Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300">This study group doesn't exist or you don't have permission to view it.</p>
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
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Success!</strong> {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{group.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {classDetails ? `${classDetails.courseCode} - ${classDetails.title}` : "Class information unavailable"}
              </p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 rounded text-xs ${group.isPrivate ? "bg-gray-200 text-gray-800" : "bg-green-200 text-green-800"}`}>
                  {group.isPrivate ? "Private Group" : "Public Group"}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isAdmin && (
                <button
                  onClick={() => navigate(`/manage-study-group/${id}`)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Manage Group
                </button>
              )}
              
              {isMember && !isAdmin && (
                <button
                  onClick={handleLeaveGroup}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Leave Group
                </button>
              )}
              
              {!isMember && !joinRequestSent && (
                <button
                  onClick={handleJoinRequest}
                  className="bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-800"
                >
                  Request to Join
                </button>
              )}
              
              {joinRequestSent && (
                <span className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
                  Join Request Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Members</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member._id} className="flex items-center p-3 border rounded bg-gray-50 dark:bg-gray-700">
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {member.username || member.email}
                    {member._id === group.adminId && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                        Admin
                      </span>
                    )}
                    {member._id === user._id && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs">
                        You
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {members.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No members found.</p>
          )}
        </div>

        {/* Study Resources Section - Placeholder for future development */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Study Resources</h2>
          <p className="text-gray-500 dark:text-gray-400">No resources have been shared in this group yet.</p>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupDetails;