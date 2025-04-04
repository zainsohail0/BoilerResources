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
  
  // --- START: Added state for the admin button toggle ---
  const [adminRequestState, setAdminRequestState] = useState({}); // Stores { groupId: 'pending' } after click
  // --- END: Added state ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch user data directly from the API
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include"
        });
        
        if (!userRes.ok) {
          // Use placeholder or try local storage if API fails initially
          const storedUserId = localStorage.getItem('userId');
          if (!storedUserId) {
             throw new Error("You must be logged in to view study groups");
          }
          setCurrentUserId(storedUserId);
          // Continue fetching other data using stored ID, but show login error if that fails too
        } else {
          const userData = await userRes.json();
          const userId = userData._id;
          setCurrentUserId(userId);
          localStorage.setItem('userId', userId); // Update local storage
        }

        // Ensure we have a userId before proceeding
        const finalUserId = currentUserId || localStorage.getItem('userId');
        if (!finalUserId) {
           throw new Error("User ID could not be determined. Please log in again.");
        }

        // Set headers for requests
        const headers = {
          "Content-Type": "application/json",
          "X-User-ID": finalUserId // Use the determined user ID
        };
        
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
        console.log("Study groups data:", groupsData);
        setStudyGroups(groupsData);
        
        // For each group, fetch user status
        const statusesObj = {};
        
        for (const group of groupsData) {
          try {
            const statusRes = await fetch(`${API_URL}/api/groups/${group._id}/user-status`, {
              headers, // Use headers with User ID
              credentials: "include"
            });
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              statusesObj[group._id] = statusData;
            } else {
              console.error(`Failed to fetch status for group ${group._id}. Status: ${statusRes.status}`);
              // Fallback status if fetch fails
               statusesObj[group._id] = {
                 isAdmin: group.adminId === finalUserId, // Basic check if status fails
                 isMember: group.members?.includes(finalUserId) || false,
                 hasPendingRequest: false, // Assume no pending request if status fails
                 status: group.adminId === finalUserId ? 'admin' : (group.members?.includes(finalUserId) ? 'member' : 'none')
               };
            }
          } catch (error) {
            console.error(`Error fetching status for group ${group._id}:`, error);
             statusesObj[group._id] = { // Fallback on error
               isAdmin: group.adminId === finalUserId,
               isMember: group.members?.includes(finalUserId) || false,
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
    
    // Ensure currentUserId is set before fetching data that depends on it
    if (currentUserId !== null) {
       fetchData();
    } else {
       // Handle case where userId is not yet available (e.g., initial load)
       // Maybe attempt to get it again or wait
       const storedUserId = localStorage.getItem('userId');
       if (storedUserId) {
          setCurrentUserId(storedUserId);
          // Optionally trigger fetchData here if needed immediately
       } else {
          // Could set an error or redirect to login if no ID is found
          setError("Could not verify user login status.");
          setLoading(false);
       }
    }

  }, [classId, currentUserId]); // Add currentUserId dependency
  
  const handleJoinGroup = async (groupId, isPrivate) => {
    try {
      setError(null);
      setSuccessMessage(null); // Clear previous success messages
      
      // Get user ID directly from state
      const userId = currentUserId;
      
      if (!userId) {
        setError("You must be logged in to join a group");
        return;
      }
      
      // Set headers for request
      const headers = {
        "Content-Type": "application/json",
        "X-User-ID": userId
      };
      
      // Call the endpoint based on whether the group is private or public
      const endpoint = isPrivate ? 
        `${API_URL}/api/groups/${groupId}/join-request` : 
        `${API_URL}/api/groups/${groupId}/join`;
      
      // Use the correct endpoint
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        credentials: "include"
      });
      
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
         result = await response.json();
      } else {
         // If not JSON, get text
         const text = await response.text();
         result = { message: text || (response.ok ? "Action successful" : "An error occurred") };
      }
            
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isPrivate ? 'request to join' : 'join'} group (Status: ${response.status})`);
      }
      
      // Show success message
      setSuccessMessage(result.message || `You've ${isPrivate ? 'requested to join' : 'joined'} the group successfully`);
      
      // Update the local state *immediately* for better UX
      // (even though the API call succeeded, we update the visual state now)
      setUserStatuses(prev => ({
        ...prev,
        [groupId]: {
          ...prev[groupId], // keep existing status details if available
          isAdmin: false, // User cannot be admin if they just joined/requested
          isMember: !isPrivate, // Become member if public
          hasPendingRequest: isPrivate, // Have pending request if private
          status: isPrivate ? 'pending' : 'member'
        }
      }));

      // No automatic navigation here, let user see the success message
      // Optionally refetch data after a delay or provide a refresh button
      // setTimeout(() => { setSuccessMessage(null); }, 5000); // Auto-hide message
      
    } catch (err) {
      console.error("Error joining group:", err);
      setError(err.message);
    }
  };
  
  // --- START: Handler for the hardcoded admin button click ---
  const handleAdminRequestClick = (groupId) => {
    setAdminRequestState(prev => ({
      ...prev,
      [groupId]: 'pending' // Mark this group's button as 'clicked' -> show pending
    }));
    // No API call or actual state change needed here as per requirement
  };
  // --- END: Handler ---

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
  
  // Handle case where classDetails failed to load but loading is finished
  if (!loading && !classDetails && !error) {
     // This might happen if the fetch completed but returned no data for the class
     // Or if the initial user ID fetch failed and prevented class fetch
     return (
       <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
          {/* Navigation Bar (still show nav) */}
          <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
             <div className="max-w-7xl mx-auto px-4">
               <div className="flex justify-between h-16">
                 <div className="flex items-center">
                   <span className="text-white text-xl font-bold">Boiler Resources</span>
                 </div>
                 <div className="flex items-center">
                   <button onClick={() => navigate('/home')} className="text-white hover:text-gray-300 mr-4">
                     Back to Dashboard
                   </button>
                 </div>
               </div>
             </div>
           </nav>
           {/* Error Message or Loading State */}
           <div className="max-w-7xl mx-auto px-4 py-8 text-center">
              {error ? (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                 </div>
              ) : (
                 <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Could not load class details.</div>
              )}
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
      
      {/* Success Message (if any) */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 py-2 mt-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
             <strong className="font-bold">Success! </strong>
             <span className="block sm:inline">{successMessage}</span>
             <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
               <button onClick={clearMessages} className="text-green-700 hover:text-green-900">
                 ×
               </button>
             </span>
          </div>
        </div>
      )}
      
      {/* Error Message (if any) */}
      {error && !successMessage && ( // Only show error if no success message
        <div className="max-w-7xl mx-auto px-4 py-2 mt-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
             <strong className="font-bold">Error: </strong>
             <span className="block sm:inline">{error}</span>
             <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
               <button onClick={clearMessages} className="text-red-700 hover:text-red-900">
                 ×
               </button>
             </span>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
         {classDetails ? ( // Only render class details if they loaded
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8"> {/* Added mb-8 */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
               <div className="mb-4 sm:mb-0">
                 <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                   Study Groups for {classDetails?.courseCode}
                 </h1>
                 <p className="text-gray-600 dark:text-gray-400">
                   {classDetails?.title}
                 </p>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                   {/* Display User ID only if available */}
                   {currentUserId ? `Logged in as: ${currentUserId}` : 'Not logged in'}
                 </p>
               </div>
               <button
                 onClick={() => navigate(`/create-study-group?classId=${classId}`)}
                 className="bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-800 w-full sm:w-auto" // Make button full width on small screens
               >
                 Create New Study Group
               </button>
             </div>
           </div>
         ) : (
             // Optionally show a placeholder or specific message if classDetails are missing but no error occurred
             !error && <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading class information...</div>
         )}
        
        {/* Study Groups List */}
        {classDetails && ( // Only show groups section if class details are loaded
           <div>
             <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Available Study Groups</h2>
             
             {studyGroups.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {studyGroups.map((group) => {
                   const userStatus = userStatuses[group._id] || { // Default if status hasn't loaded yet
                     isAdmin: group.adminId === currentUserId,
                     isMember: group.members?.includes(currentUserId) || false,
                     hasPendingRequest: false, // Safer default
                     status: 'loading' // Indicate status is loading
                   };
                   
                   const isAdmin = userStatus.isAdmin;
                   const isMember = userStatus.isMember;
                   const hasPendingRequest = userStatus.hasPendingRequest;

                   // --- START: Modified logic for admin state ---
                   const showPendingForAdmin = adminRequestState[group._id] === 'pending';
                   // --- END: Modified logic ---
                   
                   return (
                     <div key={group._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col justify-between"> {/* Added flex classes */}
                       <div> {/* Content wrapper */}
                         <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{group.name}</h3>
                         <div className="flex items-center mt-1 mb-2 flex-wrap"> {/* Added flex-wrap */}
                           <span className={`px-2 py-1 rounded text-xs mr-2 mb-1 ${group.isPrivate ? "bg-gray-200 text-gray-800" : "bg-green-200 text-green-800"}`}>
                             {group.isPrivate ? "Private Group" : "Public Group"}
                           </span>
                           <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                             {group.members?.length || 0} members
                           </span>
                         </div>
                         
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                           {/* Show admin name/indicator more clearly */}
                            Admin: {group.adminDetails ? group.adminDetails.name : (group.adminId === currentUserId ? 'You' : 'Another user')}
                            {/* Fallback if adminDetails not populated */}
                            {group.adminId === currentUserId && !group.adminDetails && ' (You)'}
                         </p>
                       </div>
                       
                       <div className="mt-4 flex justify-between items-center">
                         <button
                           onClick={() => navigate(`/groups/${group._id}`)}
                           className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm" // Made text smaller
                         >
                           View Details
                         </button>
                         
                         {/* --- START: Modified Action Button Logic --- */}
                         {isAdmin ? (
                           showPendingForAdmin ? (
                             <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"> {/* Style as requested */}
                               Request Pending
                             </span>
                           ) : (
                             <button
                               onClick={() => handleAdminRequestClick(group._id)}
                               className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm" // Button style
                             >
                               Request to Join {/* Button text as requested */}
                             </button>
                           )
                         ) : isMember ? (
                           <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                             Already a Member
                           </span>
                         ) : hasPendingRequest ? (
                           <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                             Request Pending
                           </span>
                         ) : (
                           // Original Join/Request button for non-admins/non-members
                           <button
                             onClick={() => handleJoinGroup(group._id, group.isPrivate)}
                             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                             disabled={userStatus.status === 'loading'} // Disable if status still loading
                           >
                             {userStatus.status === 'loading' ? 'Checking...' : (group.isPrivate ? "Request to Join" : "Join Group")}
                           </button>
                         )}
                         {/* --- END: Modified Action Button Logic --- */}
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center"> {/* Centered text */}
                 <p className="text-gray-600 dark:text-gray-400">
                   No study groups available for this class yet. Be the first to create one!
                 </p>
               </div>
             )}
           </div>
        )} {/* End conditional rendering for groups section */}
      </div>
    </div>
  );
};

export default ClassStudyGroups;