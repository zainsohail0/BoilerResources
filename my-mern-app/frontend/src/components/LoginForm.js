import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { apiCall } from "../utils/api";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in (session-based authentication)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(apiCall("/api/auth/me"), {
          method: "GET",
          credentials: "include", // Ensures session is checked
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Session data:", data); // Debug log
          setIsAuthenticated(true);

          // Only redirect if not already on /home
          if (window.location.pathname !== "/home") {
            navigate("/home");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    checkAuth();
  }, [navigate]);

  // Check if user was just verified
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const verified = query.get("verified");

    if (verified === "true") {
      setSuccess("Email verified successfully! You can now log in.");
    }
  }, [location]);

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNeedsVerification(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Ensures session cookie is stored
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        navigate("/home"); // Redirect on success
      } else if (data.requiresVerification) {
        setNeedsVerification(true);
      } else {
        setError(
          data.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/resend-verification",
        {
          email,
        }
      );

      if (response.status === 200) {
        setSuccess("Verification email sent. Please check your inbox.");
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError(
        err.response?.data?.message || "Failed to resend verification email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
  };

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg8.png')" }}
    >
      {/* Top Bar */}
      <div
        style={{
          backgroundColor: "#000000",
          color: "#cfb991",
          fontFamily: "United Sans, sans-serif",
        }}
        className="w-full py-4 text-center text-3xl font-bold"
      >
        Boiler Resources
      </div>

      <div className="flex justify-center items-center h-[90%]">
        {isAuthenticated ? (
          <div className="flex flex-col items-center">
            <p className="mb-4 text-lg">You are logged in!</p>
            <button
              onClick={() => navigate("/home")}
              className="text-white py-2 px-6 rounded-lg bg-yellow-600 hover:bg-yellow-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-2xl w-96 bg-opacity-90 backdrop-blur-4xl"
          >
            <h2 className="text-xl font-bold text-center mb-4">Login</h2>

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
                disabled={isSubmitting}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-sm text-gray-700"
                >
                  Remember Me
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <div className="w-full p-[1px] bg-gradient-to-r from-[#555960] via-[#6f727b] via-[#ddb945] to-[#8e6f3e] rounded-lg">
              <button
                type="submit"
                className="w-full bg-white text-black py-2 rounded-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging In..." : "Login"}
              </button>
            </div>

            {/* Google OAuth Button */}
            <div className="relative mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg
                          shadow-sm text-black hover:bg-gray-100 transition"
                style={{ backgroundColor: "#cfb991" }}
                disabled={isSubmitting}
              >
                <FcGoogle className="text-2xl mr-2" /> Sign in with Google
              </button>
            </div>

            {/* Back to Sign Up Button */}
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
        )}
      </div>
    </div>
  );
};

export default LoginForm;
