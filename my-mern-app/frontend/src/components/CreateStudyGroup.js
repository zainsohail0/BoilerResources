import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const CreateStudyGroup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userClasses, setUserClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    isPrivate: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchUserAndClasses = async () => {
      setIsLoading(true);
      try {
        // Check authentication
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!userRes.ok) {
          throw new Error("Authentication failed");
        }

        const userData = await userRes.json();
        setUser(userData);

        // Fetch user's enrolled classes
        const classesRes = await fetch(`${API_URL}/api/courses/user/${userData._id}/enrolled`, {
          credentials: "include",
        });

        if (!classesRes.ok) {
          throw new Error("Failed to fetch classes");
        }

        const classesData = await classesRes.json();
        setUserClasses(classesData);

        // Set default class if available
        if (classesData.length > 0) {
          setFormData(prev => ({ ...prev, classId: classesData[0]._id }));
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.message);
        
        // Redirect to login if authentication fails
        if (err.message === "Authentication failed") {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndClasses();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }
    
    if (!formData.classId) {
      setError("You must select a class");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          classId: formData.classId,
          isPrivate: formData.isPrivate,
          adminId: user._id,
          members: [user._id] // Add creator as first member
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create study group");
      }

      const data = await response.json();
      setSuccess("Study group created successfully!");
      
      // Redirect after a brief delay
      setTimeout(() => {
        navigate(`/study-group/${data._id}`);
      }, 1500);
    } catch (err) {
      console.error("❌ Error creating study group:", err);
      setError(err.message);
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Create Study Group</h1>
          
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
                placeholder="Enter a name for your study group"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="classId">
                Select Class
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select a class</option>
                {userClasses.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.courseCode} - {classItem.title}
                  </option>
                ))}
              </select>
              {userClasses.length === 0 && (
                <p className="text-red-500 text-xs italic mt-1">
                  You need to be enrolled in at least one class to create a study group.
                </p>
              )}
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
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={userClasses.length === 0}
                className={`bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  userClasses.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Create Study Group
              </button>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStudyGroup;