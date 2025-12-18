// src/components/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { checkAndHandleAutoLogout } from "@/utils/authUtils";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token"); // Or get from Redux state
  
  // Check if auto logout should trigger
  if (token) {
    const shouldLogout = checkAndHandleAutoLogout();
    if (shouldLogout) {
      return <Navigate to="/login" replace />;
    }
  }
  
  return token ? children : <Navigate to="/login" replace />;
}
