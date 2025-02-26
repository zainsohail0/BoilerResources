import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data); // Store user data in state
        } else {
          setUser(null);
          navigate("/login"); // Redirect if not authenticated
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
  
      const logoutResponse = await fetch("http://localhost:5001/api/auth/logout", {
        method: "GET",
        credentials: "include", // Required for session clearing
      });
  
      if (!logoutResponse.ok) {
        throw new Error("Logout failed on backend");
      }
  
      console.log("Logout successful, redirecting...");
  
      // Remove user data from state and local storage
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
  
      // Use navigate instead of a backend redirect to avoid CORS issues
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  
  

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav style={{ backgroundColor: "#000000" }} className="shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">BoileResources</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white">Welcome, {user.username}!</span>
                  <button
                    onClick={handleLogout}
                    className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <span className="text-white">Loading...</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to BoileResources</h1>
          <p className="text-gray-600">
            This is your dashboard where you can access and manage your resources.
          </p>
        </div>

        {/* Example Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">My Resources</h2>
            <p className="text-gray-600">View and manage your saved resources</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Browse Categories</h2>
            <p className="text-gray-600">Explore resources by category</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Community</h2>
            <p className="text-gray-600">Connect with other users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
