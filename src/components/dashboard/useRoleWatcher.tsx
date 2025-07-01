import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";

const useRoleWatcher = (token: string | null, userId: string | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token || !userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(
          `/users/${userId}`,
         
        );
        // console.log("Polled user data:", res.data);

        const latestRole =
          res.data.role ||
          res.data.user?.role ||
          (res.data.roles && res.data.roles[0]);

        const storedRole = localStorage.getItem("userRole");

        // console.log("Stored role:", storedRole);
        // console.log("Latest role:", latestRole);

        if (
          latestRole?.toString().toLowerCase().trim() !==
          storedRole?.toString().toLowerCase().trim()
        ) {
          console.log("Role changed detected, logging out...");
          toast({
            title: "Role Changed",
            description: "Your role has changed. Logging out...",
            variant: "destructive", // or "warning" or "info" depending on your toast design
          });

          localStorage.clear();
          navigate("/login");
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [token, userId, navigate]);
};

export default useRoleWatcher;
