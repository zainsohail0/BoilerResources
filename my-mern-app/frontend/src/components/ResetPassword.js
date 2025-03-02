import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { id, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  axios.defaults.withCredentials = true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage("");
    setError("");
    
    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      const response = await axios.post(`http://localhost:5001/api/auth/reset-password/${id}/${token}`, { newPassword });
          
      if (response.data.Status === "Success" || response.data.Status === "Password updated successfully") {
        setMessage("Password successfully reset!");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.Status || "An error occurred");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setError(err.response?.data?.Status || "Failed to reset password");
    }
  };

  return (
    <div className="h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/background.jpg')" }}>
      {/* Top Bar */}
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
        BoileResources
      </div>

      <div className="h-screen flex justify-center items-center bg-gray-100">
        <form 
          onSubmit={handleSubmit} 
          className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg"
        >
          <h2 className="text-xl font-bold text-center mb-4">Reset Password</h2>
          
          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded border border-green-200">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <button
            type="submit"
            className="w-full text-white py-2 rounded-lg transition 
                     bg-gradient-to-r from-black to-yellow-500 
                     hover:from-gray-800 hover:to-yellow-400"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;