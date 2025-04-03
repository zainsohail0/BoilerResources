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
      setError(null);
      
      try {
        // Get user ID from localStorage to help with debugging
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.warn("No userId found in localStorage");
        } else {
          console.log("Fetching pending requests for user:", userId);
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        // Fetch user's pending join requests
        console.log("Fetching from:", `${API_URL}/api/groups/pending-requests`);
        const response = await fetch(`${API_URL}/api/groups/pending-requests`, {
          headers,
          credentials: "include"
        });
        
        // Log the full response for debugging
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          
          // Check for common errors
          if (response.status === 401) {
            throw new Error("Authentication required. Please log in again.");
          } else if (response.status === 404) {
            // This is not truly an error - just means the endpoint isn't found
            // We'll show a message but not an error
            console.log("Pending requests endpoint not found - may not be implemented yet");
            setPendingRequests([]);
            setIsLoading(false);
            return;
          } else {
            throw new Error(`Failed to fetch pending requests: ${errorText}`);
          }
        }
        
        let data;
        try {
          const responseText = await response.text();
          console.log("Response text:", responseText);
          
          // Handle empty responses gracefully
          if (!responseText.trim()) {
            console.log("Empty response received");
            data = [];
          } else {
            data = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          throw new Error("Could not parse server response");
        }
        
        console.log("Pending requests data:", data);
        
        // If data isn't an array, handle gracefully
        if (!Array.isArray(data)) {
          console.warn("Response is not an array:", data);
          data = [];
        }
        
        // For each request, try to fetch class details
        const requestsWithClassDetails = await Promise.all(
          data.map(async (request) => {
            try {
              // Only fetch class details if we have a classId
              if (request.classId) {
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
              }
              
              return {
                ...request,
                className: "Unknown Class"
              };
            } catch (err) {
              console.error(`Error fetching class details for request:`, err);
              return {
                ...request,
                className: "Unknown Class"
              };
            }
          })
        );
        
        console.log("Requests with class details:", requestsWithClassDetails);
        setPendingRequests(requestsWithClassDetails);
      } catch (err) {
        console.error("❌ Error fetching pending requests:", err);
        setError(err.message || "Failed to fetch pending requests");
        
        // Even with error, we still want to set pendingRequests to empty array
        setPendingRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPendingRequests();
  }, []);
  
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
  
  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };
  
  // Handle standalone rendering (full page)
  if (isLoading && window.location.pathname === '/pending-requests') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }
  
  // Check if this is being rendered as a standalone page
  const isStandalonePage = window.location.pathname === '/pending-requests';
  
  // For standalone page, include the navigation header
  if (isStandalonePage) {
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
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Pending Join Requests
            </h1>
            
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }
  
  // For component embedded in another page
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Pending Join Requests
      </h2>
      
      {renderContent()}
    </div>
  );
  
  // Helper function to render the content
  function renderContent() {
    return (
      <>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-700"></div>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">You don't have any pending join requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div 
                key={`${request.groupId || request._id}-${Date.now()}`} 
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
                      onClick={() => handleViewGroup(request.groupId || request._id)}
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
      </>
    );
  }
};

export default PendingJoinRequests;