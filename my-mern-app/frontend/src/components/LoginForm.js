import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "tw-elements"; // Import TW Elements (free)
import { FcGoogle } from "react-icons/fc"; // Google Icon

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt with", { email, password });
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleGoogleLogin = () => {
    console.log("Google Sign-In Clicked");
  };

  return (
    <div className="h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/background.jpg')" }}>
      {/* Top Bar */}
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
       BoileResources
      </div>
      
      <div className="flex justify-center items-center h-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg"
        >
          <h2 className="text-xl font-bold text-center mb-4">Login</h2>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          {/* Password Input */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          {/* Forgot Password Button */}
          <div className="text-right mb-4">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          {/* Normal Login Button */}
          <button
            type="submit"
            className="w-full text-white py-2 rounded-lg transition 
                       bg-gradient-to-r from-black to-yellow-500 
                       hover:from-gray-800 hover:to-yellow-400"
          >
            Login
          </button>

          {/* Google OAuth Button */}
          <div className="relative mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg 
                         shadow-sm bg-white text-gray-700 hover:bg-gray-100 transition"
            >
              <FcGoogle className="text-xl mr-2" /> Sign in with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
