import axios from "axios";

// This should be called on app start or whenever access token is missing/expired
export async function getNewAccessToken() {
  try {
    // IMPORTANT: withCredentials:true so the cookie is sent!
    const res = await axios.post(
      "https://tumbledrybe.sharda.co.in/api/auth/refresh",
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
