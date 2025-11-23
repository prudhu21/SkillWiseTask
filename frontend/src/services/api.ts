// src/services/api.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';

function getBaseUrl(): string {
  try {
    const viteVal = (import.meta as any)?.env?.VITE_API_BASE;
    if (viteVal) return viteVal;
  } catch {}

  try {
    const win = window as any;
    if (win?.__REACT_APP_API_BASE) return win.__REACT_APP_API_BASE;
    if (win?.REACT_APP_API_BASE) return win.REACT_APP_API_BASE;
  } catch {}

  return 'http://localhost:5000/api';
}

const BASE_URL = getBaseUrl();
console.log('[API] Base URL =', BASE_URL);

const API: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

API.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API ERROR]:', {
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message
    });
    return Promise.reject(err);
  }
);

export default API;
