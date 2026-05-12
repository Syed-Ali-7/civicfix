import axios from "axios";

// Production Render Backend URL
const API_BASE_URL = "http://192.168.1.7:5000"; // For Development use : "http://ipv4:5000"

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Network/server unreachable
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return Promise.reject(
          new Error(
            "Request timeout. The CivicFix server is taking too long to respond."
          )
        );
      }

      return Promise.reject(
        new Error(
          "Cannot connect to CivicFix server. Please check your internet connection or try again later."
        )
      );
    }

    const { data, status } = error.response;

    // 404
    if (status === 404) {
      return Promise.reject(
        new Error("API endpoint not found.")
      );
    }

    // 503
    if (status === 503) {
      return Promise.reject(
        new Error("CivicFix server is temporarily unavailable.")
      );
    }

    // Express validation errors
    if (data?.errors && Array.isArray(data.errors)) {
      const messages = data.errors.map((err) => err.msg).join("\n");

      return Promise.reject(new Error(messages));
    }

    // Generic backend errors
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${status}`;

    return Promise.reject(new Error(message));
  }
);

// Set JWT token globally
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;