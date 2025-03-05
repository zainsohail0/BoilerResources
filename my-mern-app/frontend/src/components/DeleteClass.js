import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";
const MIN_CREDIT_HOURS = 12;

const DeleteClass = () => {
  const navigate = useNavigate();
  const [userClasses, setUserClasses] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data._id) {
          setUserId(data._id);
          fetchUserClasses(data._id);
        }
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  const fetchUserClasses = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/courses/user/${id}/enrolled`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch enrolled classes");
      }
      const data = await res.json();
      setUserClasses(data);
      setTotalCredits(data.reduce((sum, classItem) => sum + (classItem.creditHours || 0), 0));
    } catch (err) {
      console.error("Error fetching user classes:", err);
    }
  };

  const handleDeleteClick = (classItem) => {
    setClassToDelete(classItem);
    setError("");
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete || !userId) return;

    try {
      const res = await fetch(`${API_URL}/api/courses/user/${userId}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classToDelete._id }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to remove class");
      }
      const data = await res.json();
      setUserClasses(data.enrolledCourses);
      setTotalCredits(data.enrolledCourses.reduce((sum, c) => sum + (c.creditHours || 0), 0));
      setSuccess(`${classToDelete.courseCode} has been removed from your classes.`);
      setShowConfirmModal(false);
      setClassToDelete(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error removing course:", err);
      setError("The class has been removed. Go Home to view changes");
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setClassToDelete(null);
    setError("");
  };

  const handleGoBack = () => {
    navigate(-1);
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
          <h1 className="text-2xl font-bold mb-6">Manage Your Classes</h1>
          {success && <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{success}</div>}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">Total Credits: {totalCredits}</p>
          </div>
          <h2 className="text-xl font-semibold mb-4">Your Enrolled Classes</h2>
          {userClasses.length > 0 ? (
            <div className="space-y-4">
              {userClasses.map((classItem) => (
                <div key={classItem._id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-semibold">{classItem.courseCode}</h3>
                    <p>{classItem.title}</p>
                    <p className="text-sm text-gray-600">Credits: {classItem.creditHours}</p>
                  </div>
                  <button onClick={() => handleDeleteClick(classItem)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't added any classes yet.</p>
          )}
        </div>
      </div>
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            {error ? (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>
            ) : (
              <p className="mb-4">Are you sure you want to delete {classToDelete?.courseCode}?</p>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={handleCancelDelete} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteClass;
