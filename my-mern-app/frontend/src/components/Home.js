import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [userClasses, setUserClasses] = useState([]);
  
  useEffect(() => {
    // Load user classes from localStorage
    const classes = JSON.parse(localStorage.getItem('userClasses')) || [];
    setUserClasses(classes);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleAddClass = () => {
    navigate('/add-class');
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
            <div className="flex items-center gap-4">
              <span className="text-white">Welcome, {user.username || 'User'}!</span>
              <button
                onClick={handleLogout}
                className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Logout
              </button>
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

        {/* User's Classes Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{user.username || 'Your'}'s Classes</h2>
            <button 
              onClick={handleAddClass}
              className="bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 transition"
            >
              Add Class
            </button>
          </div>
          
          {userClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userClasses.map((classItem, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg">{classItem.code}</h3>
                  <p>{classItem.name}</p>
                  <p className="text-sm text-gray-600">Credits: {classItem.credits}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't added any classes yet. Click "Add Class" to get started.</p>
          )}
        </div>
        
        {/* Resource Cards */}
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