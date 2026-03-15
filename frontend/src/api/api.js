import axios from "axios";

// Create Axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Redirecting to login.");

      // Clear user data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login
      window.location.href = "/login";
    }

    // Optionally, handle rate limiting (429)
    if (error.response && error.response.status === 429) {
      console.warn("Too many requests. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default API;