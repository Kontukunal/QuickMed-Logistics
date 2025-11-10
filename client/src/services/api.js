import axios from "axios";

// Use direct URL in both development and production
const API_BASE_URL = "https://quickmed-backend-dyws.onrender.com/api";

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // These might help with CORS
  withCredentials: false,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CORS headers manually
    config.headers['Access-Control-Allow-Origin'] = '*';
    config.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
    config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    console.log('Making API request to:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      console.error('CORS Error Detected');
      // You can show a user-friendly message here
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await api.put("/auth/profile", userData);
    return response.data;
  },
};

// Orders Services - COMPLETELY UPDATED
export const ordersService = {
  // Get all orders (for admin, driver, or filtered for healthcare providers)
  getAll: async (params = {}) => {
    const response = await api.get("/orders", { params });
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  create: async (data) => {
    const response = await api.post("/orders", data);
    return response.data;
  },

  // Update order status (general)
  updateStatus: async (id, data) => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  // Driver accepts an order
  acceptOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/accept`);
    return response.data;
  },

  // Assign driver to order (admin only)
  assignDriver: async (id, driverId) => {
    const response = await api.patch(`/orders/${id}/assign-driver`, {
      driverId,
    });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get("/orders/stats/dashboard");
    return response.data;
  },

  // Get overview statistics
  getOverviewStats: async () => {
    const response = await api.get("/orders/stats/overview");
    return response.data;
  },

  // DRIVER SPECIFIC METHODS
  // Get all orders for driver (shows all orders like admin)
  getDriverOrders: async () => {
    const response = await api.get("/orders/driver/my-orders");
    return response.data;
  },

  // Update delivery status (driver specific)
  updateDeliveryStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/delivery-status`, {
      status,
    });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  // Get driver's current active order
  getCurrentDriverOrder: async () => {
    const response = await api.get("/orders/driver/current");
    return response.data;
  },

  // Get order tracking history
  getOrderTracking: async (id) => {
    const response = await api.get(`/orders/${id}/tracking`);
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
  getCategories: async () => {
    const response = await api.get("/inventory/categories");
    return response.data;
  },
  search: async (query) => {
    const response = await api.get("/inventory/search", { params: { query } });
    return response.data;
  },
};

// Users Services - UPDATED WITH DRIVER METHODS
export const usersService = {
  // Profile management
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put("/users/profile", data);
    return response.data;
  },

  // Driver specific methods
  updateDriverLocation: async (data) => {
    const response = await api.patch("/users/driver/location", data);
    return response.data;
  },
  updateDriverStatus: async (data) => {
    const response = await api.patch("/users/driver/status", data);
    return response.data;
  },
  getDriverStats: async () => {
    const response = await api.get("/users/driver/stats");
    return response.data;
  },

  // Admin user management
  getAllUsers: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Role-based user lists
  getDrivers: async () => {
    const response = await api.get("/users/drivers");
    return response.data;
  },
  getAvailableDrivers: async () => {
    const response = await api.get("/users/drivers/available");
    return response.data;
  },
  getHealthcareProviders: async () => {
    const response = await api.get("/users/healthcare-providers");
    return response.data;
  },

  // Driver availability and status
  setDriverAvailability: async (isAvailable) => {
    const response = await api.patch("/users/driver/availability", {
      isAvailable,
    });
    return response.data;
  },
  getDriverDashboard: async () => {
    const response = await api.get("/users/driver/dashboard");
    return response.data;
  },
};

// Delivery Services
export const deliveryService = {
  // Get deliveries for driver
  getMyDeliveries: async (params = {}) => {
    const response = await api.get("/deliveries/my-deliveries", { params });
    return response.data;
  },

  // Update delivery status
  updateDelivery: async (id, data) => {
    const response = await api.patch(`/deliveries/${id}`, data);
    return response.data;
  },

  // Get delivery history
  getDeliveryHistory: async (params = {}) => {
    const response = await api.get("/deliveries/history", { params });
    return response.data;
  },

  // Add delivery note
  addDeliveryNote: async (id, note) => {
    const response = await api.post(`/deliveries/${id}/notes`, { note });
    return response.data;
  },

  // Get delivery metrics
  getDeliveryMetrics: async () => {
    const response = await api.get("/deliveries/metrics");
    return response.data;
  },
};

// Notification Services
export const notificationService = {
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },
};

// Analytics Services
export const analyticsService = {
  getOrderAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/orders", { params });
    return response.data;
  },
  getDriverAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/drivers", { params });
    return response.data;
  },
  getRevenueAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/revenue", { params });
    return response.data;
  },
  getPlatformStats: async () => {
    const response = await api.get("/analytics/platform-stats");
    return response.data;
  },
};

// Upload Services
export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append("document", file);
    const response = await api.post("/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// Emergency Services
export const emergencyService = {
  createEmergencyOrder: async (data) => {
    const response = await api.post("/emergency/orders", data);
    return response.data;
  },
  getEmergencyOrders: async () => {
    const response = await api.get("/emergency/orders");
    return response.data;
  },
  assignEmergencyDriver: async (orderId, driverId) => {
    const response = await api.post("/emergency/assign-driver", {
      orderId,
      driverId,
    });
    return response.data;
  },
};

// Utility functions for API
export const apiUtils = {
  // Generic API call with error handling
  call: async (endpoint, options = {}) => {
    try {
      const response = await api(endpoint, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Handle API errors consistently
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || "An error occurred",
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: "No response from server. Please check your connection.",
        status: 0,
      };
    } else {
      // Something else happened
      return {
        message: error.message || "An unexpected error occurred",
        status: -1,
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem("token");
  },

  // Set auth token
  setToken: (token) => {
    localStorage.setItem("token", token);
  },

  // Remove auth token (logout)
  removeToken: () => {
    localStorage.removeItem("token");
  },
};

// Export the main api instance for custom requests
export default api;