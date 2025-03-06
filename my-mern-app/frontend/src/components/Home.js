import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001"; 
const MIN_CREDIT_HOURS = 12;

const Home = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userClasses, setUserClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Authentication failed");
        }

        const data = await res.json();
        setUser(data);
        fetchUserClasses(data._id);
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const fetchUserClasses = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/courses/user/${userId}/enrolled`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch enrolled classes");
      }

      const data = await res.json();
      setUserClasses(data);
      setTotalCredits(data.reduce((sum, classItem) => sum + (classItem.creditHours || 0), 0));
    } catch (err) {
      console.error("❌ Error fetching enrolled classes:", err);
      setErrorMessage(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (!logoutResponse.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  const handleAddClass = () => navigate('/add-class');
  const handleDeleteClass = () => navigate('/delete-class');
  const handleViewProfile = () => navigate('/profile');
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">Boiler Resources</span>
            </div>
            <div className="relative flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white">Welcome, {user.username}!</span>
                  <div className="relative">
                    <button onClick={toggleDropdown} className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                      </svg>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-20">
                        <button onClick={handleViewProfile} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">
                          View Profile
                        </button>
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-white">Welcome, Guest!</span>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Boiler Resources</h1>
          <p className="text-gray-600">This is your dashboard where you can access and manage your resources.</p>
        </div>

        {/* User's Classes Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">{user ? `${user.username}'s` : 'Your'} Classes</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Credits: {totalCredits} 
                {totalCredits < MIN_CREDIT_HOURS && (
                  <span className="text-red-500 ml-2">(Minimum: {MIN_CREDIT_HOURS})</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddClass} className="bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 transition">
                Add Class
              </button>
              <button onClick={handleDeleteClass} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                Delete Class
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {userClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userClasses.map((classItem) => (
                <div 
                  key={classItem._id} 
                  className="border rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => navigate(`/class/${classItem._id}`)}
                >
                  <h3 className="font-semibold text-lg">{classItem.courseCode}</h3>
                  <p>{classItem.title}</p>
                  <p className="text-sm text-gray-600">Credits: {classItem.creditHours}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't added any classes yet. Click "Add Class" to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
