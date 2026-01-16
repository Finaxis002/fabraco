import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import { setLoginTime } from "@/utils/authUtils";

const Login = () => {
  const navigate = useNavigate();
  const [isAdminLogin, setIsAdminLogin] = useState(true);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Custom CAPTCHA states
  const [captchaText, setCaptchaText] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  // Generate random CAPTCHA text
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError("");

    // Verify manual captcha
    if (userCaptchaInput !== captchaText) {
      setError("Invalid CAPTCHA - Please enter the correct code");
      generateCaptcha();
      return;
    }

    try {
      const res = await axios.post("https://fabracobe.sharda.co.in/api/auth/login", {
        userId,
        password,
        isAdminLogin,
        recaptchaToken: "manual-captcha-verified",
      });

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
        } catch (fetchErr) {}
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
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "CAPTCHA verification failed");
      } else if (err.response?.status === 401) {
        setError(err.response?.data?.message || "Invalid credentials");
      } else {
        setError(
          err.response?.data?.message ||
            "Login failed - Please check your credentials"
        );
      }
      generateCaptcha();
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

          <div className="space-y-5">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-[#5a921e] mb-1">
                {isAdminLogin ? "Admin ID" : "Email or Username"}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-[#dbf2b8] rounded-lg focus:ring-2 focus:ring-[#84c226] focus:border-[#84c226] outline-none"
                placeholder={
                  isAdminLogin ? "admin@example.com" : "you@example.com"
                }
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
                  className="absolute right-3 top-3 text-[#99be60] text-xl"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Letter CAPTCHA - Same style as document 2 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#5a921e]">
                Enter CAPTCHA
              </label>

              {/* CAPTCHA Display */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gradient-to-br from-[#dbf2b8] to-[#c5e89f] border-2 border-[#84c226] rounded-lg py-2 px-3 select-none">
                  <p
                    className="text-center text-lg font-bold tracking-widest text-[#5a921e] select-none break-all"
                    style={{
                      fontFamily: "monospace",
                      letterSpacing: "0.15em",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {captchaText}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2.5 bg-[#84c226] text-white rounded-lg hover:bg-[#5a921e] transition-colors flex-shrink-0"
                  title="Refresh CAPTCHA"
                >
                  <FiRefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* CAPTCHA Input */}
              <input
                type="text"
                placeholder="Enter the code above"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                required
                className="block w-full px-4 py-3 border border-[#dbf2b8] rounded-lg focus:ring-2 focus:ring-[#84c226] focus:border-[#84c226] outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-lg font-medium text-white
                bg-gradient-to-r from-[#84c226] to-[#5a921e]
                hover:from-[#8aba3f] hover:to-[#5a921e]
                focus:ring-2 focus:ring-offset-2 focus:ring-[#84c226]
                transition-all"
            >
              Log in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
