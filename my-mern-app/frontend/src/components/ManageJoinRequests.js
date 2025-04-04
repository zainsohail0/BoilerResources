import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001"; // Keep for potential future use / other fetches

const ManageJoinRequests = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  // const [joinRequests, setJoinRequests] = useState([]); // No longer needed for list display
  const [isLoading, setIsLoading] = useState(true); // Still useful for initial load/group fetch
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // --- State for the hardcoded request ---
  const [showHardcodedRequest, setShowHardcodedRequest] = useState(true);
  const hardcodedRequestId = 'hardcoded-request-id-123';
  const hardcodedRequestData = {
      _id: hardcodedRequestId,
      user: { // Simulate a populated user object
          _id: 'user-abc-789',
          username: 'sven',
          email: 'suheshv23@gmail.com'
      },
      userId: 'user-abc-789', // Can be redundant if user is populated
      requestedAt: new Date().toISOString() // Use current time for demo
  };
  // --- End State for hardcoded request ---

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      let userId = null;
      let fetchedGroupData = null;
      let fetchedIsAdmin = false;

      try {
        // 1. Fetch current user details (still important for admin check)
        console.log("Fetching current user...");
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        const userDebug = { status: userResponse.status, ok: userResponse.ok };

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          setDebugInfo(prev => ({ ...prev, userFetch: { ...userDebug, error: errorText } }));
          throw new Error("Failed to verify user login status. Please log in again.");
        }
        const userData = await userResponse.json();
        userId = userData._id;
        setCurrentUserId(userId);
        setDebugInfo(prev => ({ ...prev, userFetch: { ...userDebug, userId: userId } }));

        // 2. Fetch group details (still needed for group name and admin check)
        console.log(`Fetching group ${groupId} details...`);
        const headers = { "X-User-ID": userId }; // Keep headers consistent
        const groupRes = await fetch(`${API_URL}/api/groups/${groupId}`, {
          headers,
          credentials: "include"
        });
        const groupDebug = { status: groupRes.status, ok: groupRes.ok };

        if (!groupRes.ok) {
          const groupErrorText = await groupRes.text();
          setDebugInfo(prev => ({ ...prev, groupFetch: { ...groupDebug, error: groupErrorText } }));
          throw new Error(`Failed to fetch group details (Status: ${groupRes.status})`);
        }
        fetchedGroupData = await groupRes.json();
        setGroup(fetchedGroupData);
        setDebugInfo(prev => ({ ...prev, groupFetch: { ...groupDebug, adminId: fetchedGroupData?.adminId } }));

        // 3. Check if current user is the admin
        fetchedIsAdmin = fetchedGroupData.adminId === userId;
        setIsAdmin(fetchedIsAdmin);
        setDebugInfo(prev => ({ ...prev, isAdmin: fetchedIsAdmin }));

        if (!fetchedIsAdmin) {
          console.warn("User is not the admin for this group.");
          // No need to fetch requests (which we aren't doing anyway)
        } else {
           // Reset the hardcoded request visibility when the component loads/refreshes for an admin
           setShowHardcodedRequest(true);
        }

      } catch (err) {
        console.error("❌ Error in fetchData:", err);
        setError(err.message || "An unexpected error occurred during initial data fetching.");
        setDebugInfo(prev => ({ ...prev, overallError: err.message }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId]); // Only refetch if groupId changes

  // --- Hardcoded Action Handlers ---
  const handleApproveHardcodedRequest = () => {
     console.log(`'Approving' hardcoded request ${hardcodedRequestId}`);
     setShowHardcodedRequest(false); // Hide the request
     setSuccess("Hardcoded join request 'approved' successfully.");
     setError(null); // Clear any previous errors
     setTimeout(() => setSuccess(null), 3000);
  };

   const openRejectModalForHardcoded = () => {
      // Use the hardcoded ID
      setSelectedRequestId(hardcodedRequestId);
      setRejectReason(""); // Clear previous reason
      setShowRejectModal(true);
   };

   const handleRejectHardcodedRequest = () => {
     // This function will be called by the modal's reject button
     console.log(`'Rejecting' hardcoded request ${hardcodedRequestId} with reason: ${rejectReason}`);
     setShowHardcodedRequest(false); // Hide the request
     setSuccess(`Hardcoded join request 'rejected' ${rejectReason ? 'with reason.' : 'successfully.'}`);
     setError(null);
     closeRejectModal(); // Close the modal
     setTimeout(() => setSuccess(null), 3000);
   };

  // --- Utility (keep formatDate) ---
   const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };

  // --- Modal close function ---
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequestId(null); // Clear selected ID
  };


  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  // Unauthorized view (if not admin)
  if (!isAdmin) {
     return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
         {/* Nav Bar */}
         <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
               <div className="flex justify-between h-16">
               <div className="flex items-center">
                  <span className="text-white text-xl font-bold">Boiler Resources</span>
               </div>
               <div className="flex items-center space-x-4">
                  <button onClick={() => navigate(`/groups/${groupId}`)} className="text-white hover:text-gray-300">
                     Back to Group
                  </button>
               </div>
               </div>
            </div>
         </nav>
         {/* Unauthorized Message */}
         <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
               <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Unauthorized</h1>
               <p className="text-red-600 dark:text-red-400 mb-6">
                  You don't have permission to manage join requests for this group.
               </p>
               {/* Debug Info */}
               {process.env.NODE_ENV !== 'production' && (
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 text-xs font-mono overflow-auto rounded">
                     <p>Debug: User ID: {currentUserId}, Group Admin ID: {group?.adminId}, isAdmin state: {isAdmin ? 'Yes' : 'No'}</p>
                  </div>
               )}
               <button onClick={() => navigate(`/groups/${groupId}`)} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                  Return to Group
               </button>
            </div>
         </div>
      </div>
     );
  }

  // --- Main Render for Admin ---
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
                <button onClick={() => navigate(`/groups/${groupId}`)} className="text-white hover:text-gray-300">
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
            {group?.name || "Group details loading..."}
          </p>

           {/* Debug Info */}
           {process.env.NODE_ENV !== 'production' && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 text-xs font-mono overflow-auto rounded">
              <details>
                <summary className="cursor-pointer font-bold">Debug Info (click to expand)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                    {JSON.stringify({ ...debugInfo, showHardcodedRequest: showHardcodedRequest }, null, 2)}
                </pre>
                 <p>Current Error State: {error || 'None'}</p>
                 <p>Current Success State: {success || 'None'}</p>
              </details>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
               <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700 hover:text-red-900">
                 ×
               </button>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative" role="alert">
              <strong className="font-bold">Success! </strong>
              <span className="block sm:inline">{success}</span>
               <button onClick={() => setSuccess(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-green-700 hover:text-green-900">
                 ×
               </button>
            </div>
          )}

          {/* --- Hardcoded Request Display --- */}
          {showHardcodedRequest ? (
             <div className="space-y-4">
               {/* Render the single hardcoded request */}
               <div key={hardcodedRequestData._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="mb-2 sm:mb-0">
                     <p className="font-medium text-gray-900 dark:text-gray-100">
                        {hardcodedRequestData.user.username} ({hardcodedRequestData.user.email})
                     </p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                        Requested: {formatDate(hardcodedRequestData.requestedAt)}
                     </p>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto justify-end">
                     <button
                        onClick={handleApproveHardcodedRequest}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm flex-grow sm:flex-grow-0"
                     >
                        Approve
                     </button>
                     <button
                        onClick={openRejectModalForHardcoded} // Open modal for hardcoded item
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm flex-grow sm:flex-grow-0"
                     >
                        Reject
                     </button>
                  </div>
               </div>
             </div>
          ) : (
             // Show this message *only* if the hardcoded request has been hidden (approved/rejected)
             <div className="text-center py-8 border rounded-lg dark:border-gray-700">
               <p className="text-gray-600 dark:text-gray-400">No pending join requests found.</p>
                {/* Optional: Keep the public group note if relevant */}
                {group && !group.isPrivate && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    This group is public, so users can join directly without needing approval.
                    </p>
                )}
             </div>
          )}
          {/* --- End Hardcoded Request Display --- */}

        </div>
      </div>

      {/* Reject Modal (Now works for hardcoded request too) */}
      {showRejectModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
             <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
               Reject Join Request
             </h2>
             <p className="text-gray-600 dark:text-gray-400 mb-4">
               Optionally provide a reason for rejection.
             </p>
             <textarea
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
               placeholder="Reason for rejection (optional)"
               className="w-full p-2 border rounded mb-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-600"
               rows={3}
             />
             <div className="flex justify-end space-x-3">
               <button
                 onClick={closeRejectModal}
                 className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
               >
                 Cancel
               </button>
               <button
                 // Decide which reject handler to call based on the selected ID
                 onClick={selectedRequestId === hardcodedRequestId ? handleRejectHardcodedRequest : () => console.error("Reject handler for real requests not implemented in this version")}
                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
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