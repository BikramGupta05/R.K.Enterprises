import axios from "axios";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authToken}`,
      };
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
