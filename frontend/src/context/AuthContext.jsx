import React, { createContext, useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Stores user info
  const [token, setToken] = useState(null);     // JWT token
  const [loading, setLoading] = useState(true); // Loading state for app init

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", { email, password });

      // Backend returns the user object with token included
      const loggedUser = response.data;
      const jwtToken = response.data.token;

      setUser(loggedUser);
      setToken(jwtToken);

      localStorage.setItem("user", JSON.stringify(loggedUser));
      localStorage.setItem("token", jwtToken);

      API.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Logout function
  const logout = () => {
  setUser(null);
  setToken(null);

  localStorage.removeItem("user");
  localStorage.removeItem("token");

  delete API.defaults.headers.common["Authorization"];

  navigate("/login");   // 👈 force clean redirect
};

  // Update user info (e.g., profile update)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};