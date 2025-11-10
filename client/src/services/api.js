import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Orders Services
export const ordersService = {
  getAll: async (params = {}) => {
    const response = await api.get("/orders", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/orders", data);
    return response.data;
  },
  updateStatus: async (id, data) => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data;
  },
  acceptOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/accept`);
    return response.data;
  },
  assignDriver: async (id, driverId) => {
    const response = await api.patch(`/orders/${id}/assign-driver`, {
      driverId,
    });
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get("/orders/stats/dashboard");
    return response.data;
  },
  // Add these new methods for driver operations
  getDriverOrders: async () => {
    const response = await api.get("/orders/driver/my-orders");
    return response.data;
  },
  updateDeliveryStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/delivery-status`, {
      status,
    });
    return response.data;
  },
};

// Inventory Services
export const inventoryService = {
  getAll: async (params = {}) => {
    const response = await api.get("/inventory", { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/inventory", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get("/inventory/alerts/low-stock");
    return response.data;
  },
};

// Users Services
export const usersService = {
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/users/profile", data);
    return response.data;
  },
  updateDriverLocation: async (data) => {
    const response = await api.patch("/users/driver/location", data);
    return response.data;
  },
  getAvailableDrivers: async () => {
    const response = await api.get("/users/drivers/available");
    return response.data;
  },
  getAllUsers: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },
  getDrivers: async () => {
    const response = await api.get("/users/drivers");
    return response.data;
  },
  getHealthcareProviders: async () => {
    const response = await api.get("/users/healthcare-providers");
    return response.data;
  },
};

export default api;
