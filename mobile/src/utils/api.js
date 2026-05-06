import axios from "axios";
import Constants from "expo-constants";

// Backend URL configuration
let API_BASE_URL;

if (__DEV__) {
  // Development mode: Direct connection to backend IP
  API_BASE_URL = "http://10.100.20.110:5000";
  console.log("🌐 Backend at:", API_BASE_URL);
} else {
  API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://your-production-api.com";
}

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  timeout: 120000, // 120s timeout: geocoding + AI inference can be slow
  headers: {
    Accept: "application/json",
  },
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return Promise.reject(
          new Error(
            "Request timeout (120s exceeded). " +
              "The backend server is taking too long to respond. " +
              "This can happen during:\n" +
              "- Photo AI validation (checking for potholes)\n" +
              "- Address geocoding\n" +
              "- Duplicate image checking\n\n" +
              "Please wait a moment and try again. " +
              "If this persists, check if the backend server is responding normally."
          )
        );
      }
      if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
        const apiUrl = API_BASE_URL;
        return Promise.reject(
          new Error(
            `Cannot connect to server at ${apiUrl}. ` +
              "Please ensure:\n" +
              "1. Backend server is running (npm run dev)\n" +
              "2. Your device is on the same WiFi as your laptop\n" +
              "3. Firewall allows port 5000"
          )
        );
      }
      return Promise.reject(new Error(`Connection error: ${error.message}`));
    }

    // Handle HTTP status codes
    const { data, status } = error.response;

    // Handle 503 Service Unavailable
    if (status === 503) {
      return Promise.reject(
        new Error(
          "Service unavailable (503). " +
            "The backend server may be down or overloaded. " +
            "Please check if the server is running."
        )
      );
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject(
        new Error(
          `Endpoint not found (404). ` +
            `Check if the API URL is correct: ${API_BASE_URL}`
        )
      );
    }

    // Handle validation errors (express-validator format)
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const errorMessages = data.errors.map((err) => {
        return (
          err.msg ||
          err.message ||
          `${err.param}: ${err.msg || "validation failed"}`
        );
      });
      return Promise.reject(new Error(errorMessages.join(". ")));
    }

    // Handle standard error messages
    const message =
      data?.message || data?.error || `Request failed with status ${status}`;
    return Promise.reject(new Error(message));
  }
);

// Quick startup probe to /health so we can see connectivity immediately in device logs
(async () => {
  try {
    const res = await api.get("/health");
    console.log("[api] health ok", res.data);
  } catch (err) {
    console.log("[api] health check failed", err.message || err);
  }
})();

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
