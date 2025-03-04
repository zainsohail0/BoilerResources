import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001"; // ✅ Ensure correct API URL

const ClassDetails = () => {
  const { id } = useParams(); // Get class ID from URL
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/classes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClassDetails(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching class details:", err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!classDetails) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Class not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-yellow-700">{classDetails.courseCode}: {classDetails.title}</h1>
        <p className="mt-2 text-gray-700">{classDetails.description}</p>
        <p className="mt-2"><strong>Professor:</strong> {classDetails.professor}</p>
        <p className="mt-2"><strong>Credits:</strong> {classDetails.creditHours}</p>
        <p className="mt-2"><strong>Type:</strong> {classDetails.type}</p>
        <p className="mt-2"><strong>Subject:</strong> {classDetails.subject}</p>
        
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ClassDetails;
