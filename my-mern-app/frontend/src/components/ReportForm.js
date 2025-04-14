import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const ReportForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    severity: "medium",
    contentType: "comment",
    contentId: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const categoryOptions = [
    { value: "harassment", label: "Harassment or Bullying" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "spam", label: "Spam or Misleading" },
    { value: "hateSpeech", label: "Hate Speech" },
    { value: "violence", label: "Violence or Threats" },
    { value: "other", label: "Other" },
  ];

  const severityOptions = [
    { value: "low", label: "Low - Annoying but not harmful" },
    { value: "medium", label: "Medium - Inappropriate but not dangerous" },
    { value: "high", label: "High - Harmful or dangerous content" },
  ];

  const contentTypeOptions = [
    { value: "comment", label: "Comment" },
    { value: "profile", label: "User Profile" },
    { value: "studyGroup", label: "Study Group" },
    { value: "resource", label: "Shared Resource" },
    { value: "message", label: "Private Message" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.category) {
      errors.category = "Please select a category";
    }

    if (!formData.contentId) {
      errors.contentId = "Please provide a content identifier (URL, ID, or username)";
    }

    if (!formData.description || formData.description.length < 10) {
      errors.description = "Please provide a detailed description (at least 10 characters)";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      setSuccessMessage("Your report has been submitted successfully. Our team will review it shortly.");
      
      // Reset the form after successful submission
      setFormData({
        category: "",
        severity: "medium",
        contentType: "comment",
        contentId: "",
        description: "",
      });
      
      // After 3 seconds, redirect back to home
      setTimeout(() => {
        navigate("/home");
      }, 3000);
      
    } catch (err) {
      console.error("❌ Error submitting report:", err);
      setFormErrors({
        submit: err.message || "Failed to submit report. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">
                Boiler Resources
              </span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition mr-4"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Report Inappropriate Content
          </h1>

          {successMessage ? (
            <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 p-4 rounded-lg mb-6">
              {successMessage}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {formErrors.submit && (
                <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
                  {formErrors.submit}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Category of Report*
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.category
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Severity
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Content Type
                </label>
                <select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {contentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Content Identifier*
                </label>
                <input
                  type="text"
                  name="contentId"
                  value={formData.contentId}
                  onChange={handleChange}
                  placeholder="Username, URL, or ID of the content"
                  className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.contentId
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {formErrors.contentId && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.contentId}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Description*
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please describe the issue in detail"
                  rows="5"
                  className={`w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.description
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                ></textarea>
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-yellow-700 dark:bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;