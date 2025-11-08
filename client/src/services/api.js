// services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Add timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(
        `API Success: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (error.response?.status === 400) {
      // Return the actual error message from server
      return Promise.reject(error.response.data);
    }

    if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
      console.error("Server is not running or network error");
      return Promise.reject({
        success: false,
        message:
          "Cannot connect to server. Please make sure the server is running.",
      });
    }

    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
};

export const ordersAPI = {
  getAll: (params = {}) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post("/orders", orderData),
  updateStatus: (id, statusData) =>
    api.patch(`/orders/${id}/status`, statusData),
  assignDriver: (id, driverData) =>
    api.patch(`/orders/${id}/assign-driver`, driverData),
  cancel: (id) => api.patch(`/orders/${id}/cancel`),
  getStats: () => api.get("/orders/stats/overview"),
};

export const inventoryAPI = {
  getAll: (params = {}) => api.get("/inventory", { params }),
  create: (itemData) => api.post("/inventory", itemData),
  update: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  delete: (id) => api.delete(`/inventory/${id}`),
  getLowStock: () => api.get("/inventory/alerts/low-stock"),
};

export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
  updateDriverLocation: (locationData) =>
    api.patch("/users/driver/location", locationData),
  getAvailableDrivers: (vehicleType) =>
    api.get("/users/drivers/available", { params: { vehicleType } }),
};

export default api;
