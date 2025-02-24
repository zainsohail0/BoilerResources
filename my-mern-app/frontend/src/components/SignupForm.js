import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "tw-elements";
import { FcGoogle } from "react-icons/fc";

const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      console.log("Attempting to signup with:", { email, username });

      const response = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Detailed signup error:", err);
      setError("Connection error. Please try again.");
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google Sign-Up Clicked");
  };

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
      {/* Top Bar */}
      <div className="w-full bg-yellow-700 py-4 text-center text-white text-xl font-bold">
        BoileResources
      </div>

      <div className="flex justify-center items-center h-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md w-96 bg-opacity-90 backdrop-blur-lg"
        >
          <h2 className="text-xl font-bold text-center mb-4">Sign Up</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

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
          <div className="mb-4">
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

          {/* Confirm Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full text-white py-2 rounded-lg transition
                      bg-gradient-to-r from-black to-yellow-500
                      hover:from-gray-800 hover:to-yellow-400"
          >
            Sign Up
          </button>

          {/* Google OAuth Button */}
          <div className="relative mt-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg
                        shadow-sm bg-white text-gray-700 hover:bg-gray-100 transition"
            >
              <FcGoogle className="text-xl mr-2" /> Sign up with Google
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
