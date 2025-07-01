import React, { useEffect, useState, ReactNode } from "react";
import { AuthContext } from "./AuthContext";

// Type for your user, you can improve it as per your user object
interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  // ...add other fields as needed
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // RESTORE: On first load, check localStorage for token/user
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  // Standard login logic
  const login = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Standard logout logic
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
