import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001";

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "pending",
    category: "",
    severity: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionData, setActionData] = useState({
    status: "reviewing",
    adminNotes: "",
    actionTaken: "none",
  });

  useEffect(() => {
    fetchReports();
  }, [filters, pagination.page]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
  
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.severity) queryParams.append("severity", filters.severity);
  
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
  
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
  
      // Debug: Log the full URL and headers
      console.log("Fetching reports from:", `${API_URL}/api/reports?${queryParams.toString()}`);
      console.log("Headers:", headers);
  
      const res = await fetch(`${API_URL}/api/reports?${queryParams.toString()}`, {
        headers,
        credentials: "include",
      });
  
      // Debug: Log response status and content type
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
  
      if (!res.ok) {
        // Get more information about the error
        const errorText = await res.text();
        console.error("API Error response:", errorText);
        throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
      }
  
      const data = await res.json();
      
      // Debug: Log the response data
      console.log("API Response data:", data);
      
      if (data.success) {
        setReports(data.data.reports);
        setPagination({
          ...pagination,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages,
        });
      } else {
        throw new Error(data.message || "Failed to fetch reports");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    // Reset to first page when changing filters
    setPagination({
      ...pagination,
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({
        ...pagination,
        page: newPage,
      });
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setActionData({
      status: report.status === "pending" ? "reviewing" : report.status,
      adminNotes: report.adminNotes || "",
      actionTaken: report.actionTaken || "none",
    });
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  const handleActionChange = (e) => {
    const { name, value } = e.target;
    setActionData({
      ...actionData,
      [name]: value,
    });
  };

  const handleSubmitAction = async () => {
    try {
      // Show loading state or indicator if needed
      
      const res = await fetch(`${API_URL}/api/reports/${selectedReport._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(actionData),
      });
  
      const responseText = await res.text();
      
      // Try to parse as JSON, but keep text if it fails
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error("Invalid response from server: " + responseText);
      }
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to update report");
      }
      
      if (data.success) {
        // Update the report in the list
        setReports(reports.map(report => 
          report._id === selectedReport._id ? data.data : report
        ));
        // Close the modal
        setSelectedReport(null);
        // Refresh the list
        fetchReports();
      } else {
        throw new Error(data.message || "Failed to update report");
      }
    } catch (err) {
      console.error("Error updating report:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      harassment: "Harassment or Bullying",
      inappropriate: "Inappropriate Content",
      spam: "Spam or Misleading",
      hateSpeech: "Hate Speech",
      violence: "Violence or Threats",
      other: "Other",
    };
    return categories[category] || category;
  };

  const getSeverityLabel = (severity) => {
    const severities = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };
    return severities[severity] || severity;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "reviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "dismissed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "violence":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "hateSpeech":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "harassment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "inappropriate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "spam":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "other":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-yellow-700 dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold">
                Boiler Resources - Admin
              </span>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate("/home")}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition mr-4"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Manage Content Reports
          </h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
              Error: {error}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Categories</option>
                <option value="violence">Violence or Threats</option>
                <option value="hateSpeech">Hate Speech</option>
                <option value="harassment">Harassment or Bullying</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="spam">Spam or Misleading</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Severity
              </label>
              <select
                name="severity"
                value={filters.severity}
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
            </div>
          ) : reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Severity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {report.reporterId?.username || "Unknown User"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeClass(report.category)}`}>
                          {getCategoryLabel(report.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeClass(report.severity)}`}>
                          {getSeverityLabel(report.severity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">No reports found matching your filters.</p>
            </div>
          )}

          {/* Pagination */}
          {reports.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} reports
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                      ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                      : "bg-yellow-700 text-white hover:bg-yellow-800 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                      : "bg-yellow-700 text-white hover:bg-yellow-800 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Modal for Viewing/Managing a Report */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Report Details
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reported</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatDate(selectedReport.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reported by</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedReport.reporterId?.username || "Unknown User"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeClass(selectedReport.category)}`}>
                        {getCategoryLabel(selectedReport.category)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Severity</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeClass(selectedReport.severity)}`}>
                        {getSeverityLabel(selectedReport.severity)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Content Type</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedReport.contentType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Content ID/Reference</p>
                      <p className="text-gray-900 dark:text-gray-100 break-all">
                        {selectedReport.contentId}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100">
                      {selectedReport.description}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      Admin Action
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                          Update Status
                        </label>
                        <select
                          name="status"
                          value={actionData.status}
                          onChange={handleActionChange}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="reviewing">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                          Action Taken
                        </label>
                        <select
                          name="actionTaken"
                          value={actionData.actionTaken}
                          onChange={handleActionChange}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="none">No Action Required</option>
                          <option value="warning">Warning Issued</option>
                          <option value="remove">Content Removed</option>
                          <option value="ban">User Banned</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Admin Notes
                      </label>
                      <textarea
                        name="adminNotes"
                        value={actionData.adminNotes}
                        onChange={handleActionChange}
                        placeholder="Add notes about this report and actions taken"
                        rows="3"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={handleCloseModal}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitAction}
                        className="bg-yellow-700 dark:bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-800 dark:hover:bg-yellow-700 transition"
                      >
                        Submit Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;