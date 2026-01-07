import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";
import { setLoginTime } from "@/utils/authUtils";

const RECAPTCHA_SITE_KEY = "6LfwLlMrAAAAAIFtLSnFxwGP_xfkeDU7xuz69sLa";

const Login = () => {
  const navigate = useNavigate();

  const [isAdminLogin, setIsAdminLogin] = useState(true);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");


   useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If token exists, user is already logged in
      // Send them to dashboard (or whatever default page)
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleCaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || "");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "https://fabracobe.sharda.co.in/api/auth/login",
        {
          userId,
          password,
          isAdminLogin,
          recaptchaToken,
        }
      );

      const { token, role, user } = res.data;

      // Check if trying to login as admin but user is not an admin
      if (isAdminLogin && role !== "Admin") {
        setError("Only administrators can login through this portal");
        return;
      }

      let fullUser = user;

      // If not admin, fetch full user details
      if (role !== "Admin") {
        try {
          const userRes = await axios.get(
            `https://fabracobe.sharda.co.in/api/users/${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          fullUser = userRes.data;
        } catch (fetchErr) {
          console.error("Failed to fetch full user data:", fetchErr);
        }
      }

      // Save token, role, and full user data to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("user", JSON.stringify(fullUser));

      // Set login time for auto logout functionality
      setLoginTime();

      navigate(role === "Admin" ? "/admin-dashboard" : "/user-dashboard");
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(
          err.response.data.message ||
            "Too many attempts. Please try again later."
        );
      } else {
        setError(err.response?.data?.message || "Login failed");
      }
    }
  };

 
 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fcfef5] to-[#dbf2b8] px-4">
    <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-[#dbf2b8]">
      
      {/* Decorative header */}
      <div className="h-2 bg-gradient-to-r from-[#84c226] to-[#8aba3f]" />

      <div className="p-8">
        <h2 className="text-3xl font-bold text-center mb-2 text-[#5a921e]">
          FCA – Waasle
        </h2>

        <p className="text-center my-4 text-lg font-semibold text-[#84c226] mb-8">
          {isAdminLogin ? "Admin Dashboard" : "User Dashboard"}
        </p>

        {/* Role toggle */}
        <div className="mb-8">
          <div className="relative flex items-center bg-[#dbf2b8] rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsAdminLogin(true)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                isAdminLogin
                  ? "bg-white text-[#5a921e] shadow"
                  : "text-[#99be60]"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setIsAdminLogin(false)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                !isAdminLogin
                  ? "bg-white text-[#5a921e] shadow"
                  : "text-[#99be60]"
              }`}
            >
              User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-[#5a921e] mb-1">
              {isAdminLogin ? "Admin ID" : "Email or Username"}
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-[#dbf2b8] rounded-lg focus:ring-2 focus:ring-[#84c226] focus:border-[#84c226] outline-none"
              placeholder={isAdminLogin ? "admin@example.com" : "you@example.com"}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#5a921e] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 border border-[#dbf2b8] rounded-lg focus:ring-2 focus:ring-[#84c226] focus:border-[#84c226] outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-3 text-[#99be60]"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <ReCAPTCHA
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
          

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-lg font-medium text-white
              bg-gradient-to-r from-[#84c226] to-[#5a921e]
              hover:from-[#8aba3f] hover:to-[#5a921e]
              focus:ring-2 focus:ring-offset-2 focus:ring-[#84c226]
              transition-all"
          >
            Log in →
          </button>
        </form>
      </div>
    </div>
  </div>
);

};

export default Login;
