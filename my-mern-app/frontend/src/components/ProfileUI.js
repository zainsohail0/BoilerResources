import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const ProfileUI = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    college: '',
    position: '',
    grade: '',
    major: '',
  });
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:5001/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Fetched user data:", data); // Debugging log
          setProfile(data);
          setOriginalProfile(data);
          setUser(data); // Set user data for header
        } else {
          setUser(null);
          navigate("/login"); // Redirect if not authenticated
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    console.log("isEditing state changed:", isEditing);
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    // Remove required validation for now
    return newErrors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const userId = localStorage.getItem('userId'); // Assuming you store the user ID in localStorage
      const response = await axios.put(`/api/profile/${userId}`, profile);
      setMessage(response.data.message);
      setOriginalProfile(profile); // Update original profile to the new saved profile
      setIsEditing(false);
    } catch (error) {
      setMessage(error.response.data.message || 'Error updating profile');
    }
  };

  const handleCancel = () => {
    console.log("Cancel button clicked!"); // Debugging log
    setProfile(originalProfile); // Reset profile to original values
    setIsEditing(false);
    setMessage(''); // Clear the message
  };

  const handleEdit = () => {
    console.log("Edit button clicked!"); // Debugging log
    setIsEditing(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // If still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <div className="relative flex items-center gap-4">
              {user ? (
                <span className="text-white">Welcome, {user.username}!</span>
              ) : (
                <span className="text-white">Welcome, User!</span>
              )}
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="text-white bg-black dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16m-7 6h7"
                    ></path>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2 z-20">
                    <button
                      onClick={handleGoHome}
                      className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Home
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          {message && <p className="text-center text-green-500 dark:text-green-400">{message}</p>}
          <form key={isEditing ? "editing" : "viewing"} className="mt-8 space-y-6" onSubmit={handleSave}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="flex items-center">
                <label htmlFor="username" className="w-1/4">Username:</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={profile.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="Username"
                />
                {errors.username && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.username}</p>}
              </div>
              <div className="flex items-center">
                <label htmlFor="email" className="w-1/4">Email:</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="Email"
                />
                {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="flex items-center">
                <label htmlFor="position" className="w-1/4">Position:</label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  value={profile.position}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="Position"
                />
                {errors.position && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.position}</p>}
              </div>
              <div className="flex items-center">
                <label htmlFor="grade" className="w-1/4">Grade:</label>
                <input
                  id="grade"
                  name="grade"
                  type="text"
                  value={profile.grade}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="Grade"
                />
                {errors.grade && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.grade}</p>}
              </div>
              <div className="flex items-center">
                <label htmlFor="major" className="w-1/4">Major:</label>
                <input
                  id="major"
                  name="major"
                  type="text"
                  value={profile.major}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="Major"
                />
                {errors.major && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.major}</p>}
              </div>
              <div className="flex items-center">
                <label htmlFor="college" className="w-1/4">College:</label>
                <input
                  id="college"
                  name="college"
                  type="text"
                  value={profile.college}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`appearance-none rounded-none relative block w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm ${!isEditing ? "bg-gray-200 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}`}
                  placeholder="College"
                />
                {errors.college && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.college}</p>}
              </div>
            </div>

            <div>
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mt-2"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white !bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileUI;