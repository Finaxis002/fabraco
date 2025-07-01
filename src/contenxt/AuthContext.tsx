// Create this if you don't have it already
// src/context/AuthContext.tsx
import { createContext, useContext } from 'react';

export interface AuthContextType {
  currentUser: any; // (or your specific User type)
  loading: boolean;
  login: (user: any, token: string) => void;   // <-- add this
  logout: () => void;                          // <-- and this
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: () => {},   // Provide default no-op functions
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);