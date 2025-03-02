import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  axios.defaults.withCredentials = true;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage("");
    setError("");
    
    try {
      const response = await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
      
      if (response.data.Status === "Success") {
        setMessage("Password reset email sent. Please check your inbox.");
      } else {
        setError(response.data.Status || "An error occurred");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.response?.data?.Status || "Failed to send reset email");
    }
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Email is required.");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    console.log("Password reset request for:", email);
    alert("If an account with that email exists, you will receive a reset link.");
  };

  return (
    <div className="h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/background.jpg')" }}>
      {/* Top Bar */}
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
        BoileResources
      </div>

      <div className="h-screen flex justify-center items-center bg-gray-100">
      <div
        style={{ backgroundColor: "#000000", color: "#cfb991", fontFamily: "United Sans, sans-serif" }}
        className="w-full py-4 text-center text-3xl font-bold"
      >
        Boiler Resources
      </div>

      <div className="flex justify-center items-center h-[90%]">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg"
        >
          <h2 className="text-xl font-bold text-center mb-4">Forgot Password</h2>
          
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


          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
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

              onBlur={validateEmail}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {/* Reset Password Button */}
          <div className="w-full p-[1px] bg-gradient-to-r from-[#555960] via-[#6f727b] via-[#ddb945] to-[#8e6f3e] rounded-lg">
            <button
              type="submit"
              className="w-full text-black py-2 rounded-lg transition bg-white"
            >
              Reset Password
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;