import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * - children: component to render if authorized
 * - roles: array of roles allowed to access the route (optional)
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, token, loading } = useContext(AuthContext);

  // Show loading state while authentication is initializing
  if (loading) {
    return <p>Loading...</p>; // You can replace this with a spinner component
  }

  // If user is not logged in → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role to avoid case issues (User vs user)
  const userRole = user?.role?.toLowerCase();
  const allowedRoles = roles.map((r) => r.toLowerCase());

  // Debug logs (helpful during development)
  console.log("User Role:", userRole);
  console.log("Allowed Roles:", allowedRoles);

  // Role-based access check
  if (roles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized → render protected content
  return children;
};

export default ProtectedRoute;