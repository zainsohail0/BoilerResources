// API base URL configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Helper function for API calls
export const apiCall = (endpoint) => `${API_BASE_URL}${endpoint}`;