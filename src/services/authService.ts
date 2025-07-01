// src/services/authService.ts
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const refreshAuthToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
    return null;
  } catch (error) {
    return null;
  }
};