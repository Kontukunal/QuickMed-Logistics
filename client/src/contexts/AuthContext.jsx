import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authService
        .getCurrentUser()
        .then((response) => {
          if (response.success && response.data) {
            setUser(response.data.user);
          }
        })
        .catch((error) => {
          console.error("Auto-login error:", error);
          localStorage.removeItem("token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login with:", { email });
      const response = await authService.login(email, password);
      console.log("Login response:", response);

      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        setUser(user);
        return { success: true, user };
      } else if (response.token) {
        // Alternative response structure
        const { token, user } = response;
        localStorage.setItem("token", token);
        setUser(user);
        return { success: true, user };
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log("Attempting registration with data:", userData);
      const response = await authService.register(userData);
      console.log("Registration response:", response);

      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        setUser(user);
        return { success: true, user };
      } else if (response.token) {
        // Alternative response structure
        const { token, user } = response;
        localStorage.setItem("token", token);
        setUser(user);
        return { success: true, user };
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        dataSent: userData,
      });

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
