//rolesApi.ts
import axiosInstance from "@/utils/axiosInstance";
import axios from "axios";

export const fetchRoles = async () => {
  // ✅ Correct API endpoint
const res = await axiosInstance.get("/roles");
  // console.log('API Response:', res); // Log the full response
  // console.log('Response data:', res.data); // Log the data property
  return res.data || [];
};


export const updateRole = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/roles/${id}`, data);
  return res.data;
};
