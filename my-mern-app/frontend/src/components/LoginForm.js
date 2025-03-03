import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was just verified
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const verified = query.get("verified");
    
    if (verified === "true") {
      setSuccess("Email verified successfully! You can now log in.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNeedsVerification(false);
    setIsSubmitting(true);

    try {
      const response = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response?.data?.requiresVerification) {
        setNeedsVerification(true);
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post("http://localhost:5001/api/auth/resend-verification", {
        email,
      });
      
      if (response.status === 200) {
        setSuccess("Verification email sent. Please check your inbox.");
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
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
          <h2 className="text-xl font-bold text-center mb-4">Log In</h2>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Needs Verification Message */}
          {needsVerification && (
            <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <p>Your email address has not been verified.</p>
              <button
                type="button"
                onClick={resendVerificationEmail}
                className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                disabled={isSubmitting}
              >
                Resend Verification Email
              </button>
            </div>
          )}

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
              disabled={isSubmitting}
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
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
              disabled={isSubmitting}
            />
            <div className="mt-1 text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`w-full text-white py-2 rounded-lg transition
                      bg-gradient-to-r from-black to-yellow-500
                      hover:from-gray-800 hover:to-yellow-400
                      ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>

          {/* Google OAuth Button */}
          <div className="relative mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg
                        shadow-sm bg-white text-gray-700 hover:bg-gray-100 transition"
              disabled={isSubmitting}
            >
              <FcGoogle className="text-xl mr-2" /> Sign in with Google
            </button>
          </div>

          {/* Signup Link */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Don't have an account?{" "}
            </span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;