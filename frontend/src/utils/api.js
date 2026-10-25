import axios from "axios";

export const FILE_URL = import.meta.env.VITE_FILE_URL || "https://api.kingcreativestudio.my.id/kasta/kasta";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "https://api.kingcreativestudio.my.id/kasta/kasta/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kasta_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("kasta_token")) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);
