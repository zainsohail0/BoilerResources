import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001"; // ✅ Ensure correct API URL

const AddClass = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [userId, setUserId] = useState(null);

  // ✅ Fetch user details on component mount
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include", // Ensures cookies are sent
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setUserId(data.id);
          fetchUserClasses(data.id);
        }
      })
      .catch((err) => console.error("❌ Error fetching user:", err));
  }, []);

  // ✅ Fetch all available courses
  useEffect(() => {
    fetch(`${API_URL}/api/courses`)
      .then((res) => res.json())
      .then((data) => setSearchResults(data))
      .catch((err) => console.error("❌ Error fetching courses:", err));
  }, []);

  // ✅ Fetch user-enrolled classes
  const fetchUserClasses = (id) => {
    fetch(`${API_URL}/api/classes/user/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📌 User's enrolled classes:", data);
        setUserClasses(data);
      })
      .catch((err) => console.error("❌ Error fetching user courses:", err));
  };

  // ✅ Handle adding a class
  const handleAddClass = (classItem) => {
    if (!userId) {
      console.error("❌ User ID not found");
      return;
    }

    fetch(`${API_URL}/api/classes/user/${userId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: classItem._id }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Added class successfully:", data);
        setUserClasses(data.courses);
      })
      .catch((err) => console.error("❌ Error adding course:", err));
  };

  // ✅ Handle removing a class
  const handleRemoveClass = (classId) => {
    if (!userId) {
      console.error("❌ User ID not found");
      return;
    }

    fetch(`${API_URL}/api/classes/user/${userId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: classId }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Removed class successfully:", data);
        setUserClasses(data.courses);
      })
      .catch((err) => console.error("❌ Error removing course:", err));
  };

  // ✅ Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Search and Add Classes</h1>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by class code or name (e.g., CS18000 or Calculus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-700"
            />
          </div>

          {/* Search Results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults
                  .filter(
                    (classItem) =>
                      classItem.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      classItem.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((classItem) => {
                    const isAdded = userClasses.some((c) => c._id === classItem._id);
                    return (
                      <div key={classItem._id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{classItem.courseCode}</h3>
                          <p>{classItem.title}</p>
                          <p className="text-sm text-gray-600">Credits: {classItem.creditHours}</p>
                        </div>
                        <button
                          onClick={() => handleAddClass(classItem)}
                          disabled={isAdded}
                          className={`px-4 py-2 rounded-lg ${
                            isAdded
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-yellow-700 text-white hover:bg-yellow-800"
                          } transition`}
                        >
                          {isAdded ? "Added" : "Add Class"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500">
                {searchTerm.trim() === "" ? "Type in the search box to find classes" : "No classes found matching your search term"}
              </p>
            )}
          </div>

          {/* Currently Added Classes */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Selected Classes</h2>
            {userClasses.length > 0 ? (
              <div className="space-y-4">
                {userClasses.map((classItem) => (
                  <div key={classItem._id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{classItem.courseCode}</h3>
                      <p>{classItem.title}</p>
                      <p className="text-sm text-gray-600">Credits: {classItem.credits}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveClass(classItem._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You haven't added any classes yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClass;
