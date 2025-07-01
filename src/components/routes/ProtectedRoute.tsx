// src/components/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token"); // Or get from Redux state
  return token ? children : <Navigate to="/login" replace />;
}
