import axios from "axios";

export const http = axios.create({
  baseURL: "https://localhost:7017/v1/api",
});

http.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error("Network error. Please check your connection."));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);
