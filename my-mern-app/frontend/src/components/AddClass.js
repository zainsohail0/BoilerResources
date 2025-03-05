import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const AddClass = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [userId, setUserId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses`, {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error(`Courses fetch failed: ${response.status}`);
        }

        const coursesData = await response.json();
        setSearchResults(coursesData);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include"
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAuthError("Unauthorized: Please log in");
            navigate('/login');
            return;
          }
          throw new Error(`Authentication failed with status: ${response.status}`);
        }

        const userData = await response.json();

        if (userData && userData._id) {
          setUserId(userData._id);
          fetchUserClasses(userData._id);
        } else {
          setAuthError("No user information found");
          navigate('/login');
        }
      } catch (error) {
        setAuthError(error.message);
        navigate('/login');
      }
    };

    checkAuthentication();
  }, [navigate]);

  const fetchUserClasses = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/user/${id}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user classes: ${response.status}`);
      }
      
      const classes = await response.json();
      setUserClasses(classes);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddClass = async (classItem) => {
    if (!userId) {
      setErrorMessage("User ID not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/courses/user/${userId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classItem._id }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to add class");
        return;
      }

      fetchUserClasses(userId);
      setSuccessMessage(`Successfully added ${classItem.courseCode}`);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-yellow-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <button onClick={handleGoBack} className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition">Back to Home</button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Search and Add Classes</h1>
          <input type="text" placeholder="Search by class code or name (e.g., CS18000 or Calculus)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-700" />
          <div className="mb-8 mt-4">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.filter((classItem) => classItem.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) || classItem.title.toLowerCase().includes(searchTerm.toLowerCase())).map((classItem) => {
                  const isAdded = userClasses.some((c) => c._id === classItem._id);
                  return (
                    <div key={classItem._id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{classItem.courseCode}</h3>
                        <p>{classItem.title}</p>
                        <p className="text-sm text-gray-600">Credits: {classItem.creditHours}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAddClass(classItem)} disabled={isAdded} className={`px-4 py-2 rounded-lg ${isAdded ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-yellow-700 text-white hover:bg-yellow-800"} transition`}>{isAdded ? "Added" : "Add Class"}</button>
                        <button onClick={() => navigate(`/class/${classItem._id}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Details</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">{searchTerm.trim() === "" ? "Type in the search box to find classes" : "No classes found matching your search term"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClass;
