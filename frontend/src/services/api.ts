// src/services/api.ts
import axios from "axios";
import type { AxiosInstance } from "axios";

/**
 * Vite will inject this automatically in production.
 * Local fallback is useful during development.
 */
const BASE_URL =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

console.log("[API] Base URL =", BASE_URL);

const API: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token if available
API.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Log detailed API errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API ERROR]:", {
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return Promise.reject(err);
  }
);

export default API;
