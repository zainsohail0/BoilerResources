import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "tw-elements";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

const SignupForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    let newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Validate inputs before proceeding
    if (!validateInputs()) {
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Attempting to signup with:", { email, username });

      const response = await axios.post(
        "http://localhost:5001/api/auth/signup",
        {
          username,
          email,
          password,
        }
      );

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (response.status === 201) {
        setSuccess(
          "Account created! Please check your email to verify your account."
        );
        // Clear form fields
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
      } else {
        setError(response.data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Detailed signup error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Connection error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
  };

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.jpg')" }}
    >
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
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-2xl w-96 bg-opacity-90 backdrop-blur-lg"
        >
          <h2 className="text-xl font-bold text-center mb-4">Sign Up</h2>

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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Signup Button */}
          <div className="w-full p-[1px] bg-gradient-to-r from-[#555960] via-[#6f727b] via-[#ddb945] to-[#8e6f3e] rounded-lg">
            <button
              type="submit"
              className="w-full bg-white text-black py-2 rounded-lg disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>
          </div>

          <div className="relative mt-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center py-2 border border-gray-300 rounded-lg
                        shadow-sm text-black hover:bg-gray-100 transition"
              style={{ backgroundColor: "#cfb991" }}
              disabled={isSubmitting}
            >
              <FcGoogle className="text-2xl mr-2" /> Sign up with Google
            </button>
          </div>

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
