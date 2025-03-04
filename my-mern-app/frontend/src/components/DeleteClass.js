import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Minimum credit hours threshold
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
    // Fetch user ID from the backend
    fetch("/api/auth/me", {
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
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  const fetchUserClasses = (id) => {
    fetch(`/api/courses/user/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setUserClasses(data);
        setTotalCredits(data.reduce((sum, classItem) => sum + classItem.credits, 0));
      })
      .catch((err) => console.error("Error fetching user courses:", err));
  };

  const handleDeleteClick = (classItem) => {
    setClassToDelete(classItem);
    setError("");
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (!classToDelete || !userId) return;

    const newTotalCredits = totalCredits - classToDelete.credits;

    if (newTotalCredits < MIN_CREDIT_HOURS) {
      setError(`Cannot delete this class as it would put you below the minimum ${MIN_CREDIT_HOURS} credit hours requirement.`);
      return;
    }

    fetch(`/api/courses/user/${userId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: classToDelete._id }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUserClasses(data.courses);
        setTotalCredits(data.courses.reduce((sum, c) => sum + c.credits, 0));
        setSuccess(`${classToDelete.courseCode} has been removed from your classes.`);
        setShowConfirmModal(false);
        setClassToDelete(null);
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch((err) => console.error("Error removing course:", err));
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
          <h1 className="text-2xl font-bold mb-6">Manage Your Classes</h1>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Credit Hours Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <span className="font-semibold">Current Credit Hours:</span> {totalCredits}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Minimum required credit hours: {MIN_CREDIT_HOURS}
            </p>
          </div>

          {/* Classes List */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Enrolled Classes</h2>

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
                      onClick={() => handleDeleteClick(classItem)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
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

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>

            {error ? (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            ) : (
              <p className="mb-4">
                Are you sure you want to delete <span className="font-semibold">{classToDelete?.courseCode}: {classToDelete?.title}</span>?
                <br /><br />
                This will reduce your total credit hours from <span className="font-semibold">{totalCredits}</span> to <span className="font-semibold">{totalCredits - (classToDelete?.credits || 0)}</span>.
                <br /><br />
                This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              {!error && (
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteClass;
