import axios from "axios";

// This should be called on app start or whenever access token is missing/expired
export async function getNewAccessToken() {
  const BASE_URL = import.meta.env.VITE_BASE_URL
  try {
    // IMPORTANT: withCredentials:true so the cookie is sent!
    const res = await axios.post(
       `${BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    // Save new token in localStorage
    localStorage.setItem("token", res.data.token);
    return res.data.token;
  } catch (err) {
    // Could not refresh; need to login again
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    return null;
  }
}
