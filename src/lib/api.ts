// src/libhttps://tumbledrybe.sharda.co.in/api.ts
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const api = axios.create({
  baseURL: "https://tumbledrybe.sharda.co.in/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast({
        title: "Session Expired",
        description: "Please login again",
        variant: "destructive",
      });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;