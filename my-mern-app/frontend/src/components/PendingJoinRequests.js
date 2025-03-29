
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const PendingJoinRequests = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        // Fetch user's pending join requests
        const response = await fetch(`${API_URL}/api/groups/pending-requests`, {
          headers,
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch pending requests");
        }
        
        const data = await response.json();
        
        // Fetch class details for each pending request
        const requestsWithClassDetails = await Promise.all(
          data.map(async (request) => {
            try {
              const classRes = await fetch(`${API_URL}/api/courses/${request.classId}`, {
                headers,
                credentials: "include"
              });
              
              if (classRes.ok) {
                const classData = await classRes.json();
                return {
                  ...request,
                  className: `${classData.courseCode} - ${classData.title}`
                };
              }
              
              return {
                ...request,
                className: "Unknown Class"
              };
            } catch (err) {
              console.error(`Error fetching class details for ${request.classId}:`, err);
              return {
                ...request,
                className: "Unknown Class"
              };
            }
          })
        );
        
        setPendingRequests(requestsWithClassDetails);
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPendingRequests();
  }, []);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Pending Join Requests
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {pendingRequests.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">You don't have any pending join requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map(request => (
            <div 
              key={`${request.groupId}-${request.requestedAt}`} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{request.groupName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.className}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Requested: {formatDate(request.requestedAt)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handleViewGroup(request.groupId)}
                    className="text-yellow-700 dark:text-yellow-500 hover:underline text-sm"
                  >
                    View Group
                  </button>
                </div>
              </div>
              <div className="mt-2 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-2 rounded text-sm">
                <p className="text-yellow-800 dark:text-yellow-300">
                  <span className="font-medium">Status:</span> Waiting for admin approval
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingJoinRequests;