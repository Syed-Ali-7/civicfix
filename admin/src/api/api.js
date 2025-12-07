import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  // Do not set a global Content-Type header here. When sending
  // FormData (file uploads) we must allow axios to set the
  // multipart/form-data boundary automatically. Setting a
  // global Content-Type to application/json prevents that and
  // causes multer to not parse file uploads correctly.
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Admin authentication
export const adminAuth = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
};

// Issues API
export const issuesAPI = {
  getAll: async () => {
    const response = await api.get("/issues");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/issues/${id}`, { status });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  },
  uploadImage: async (id, imageFile, extra = {}) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    // Append any extra fields (e.g., status) so backend can decide whether
    // this is a resolved photo or an updated report photo.
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await api.put(`/issues/${id}`, formData);
    return response.data;
  },
};

export default api;
