/**
 * API Client - Axios instance with auth token injection
 */

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth-token";

// LAN IP for physical device testing
const BASE_URL = __DEV__
  ? "http://192.168.8.115:3001"
  : "https://nuzum.fun";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - inject Bearer token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "حدث خطأ في الخادم";

      return Promise.reject({
        message,
        status: error.response.status,
      });
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        message: "انتهت مهلة الاتصال بالخادم",
        status: 408,
      });
    }

    return Promise.reject({
      message: "لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت",
      status: 0,
    });
  }
);

/**
 * Update the base URL at runtime (useful for settings screen)
 */
export function setBaseURL(url: string) {
  api.defaults.baseURL = url;
}

export { api, TOKEN_KEY };
