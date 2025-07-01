import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import ReCAPTCHA from "react-google-recaptcha";

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

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        // Ensure the service worker is ready before subscribing to push notifications
        console.log("Service Worker ready");
      })
      .catch((error) => {
        console.error("Service Worker is not ready", error);
      });
  }


  const subscribeToPushNotifications = async (
    userId: string,
    token: string
  ) => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      // 1. Register service worker if not already registered
      await navigator.serviceWorker.register("/service-worker.js");

      // 2. Wait for the SW to be ready and controlling the page
      const swRegistration = await navigator.serviceWorker.ready;

      // 3. NOW safe to subscribe for push!
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          "BFiAnzKqV9C437P10UIT5_daMne46XuJiVuSn4zQh2MQBjUIwMP9PMgk2TFQL9LOSiQy17eie7XRYZcJ0NE7jMs",
      });

      try {
        const response = await fetch(
          "https://tumbledrybe.sharda.co.in/api/pushnotifications/save-subscription",
          {
            method: "POST",
            body: JSON.stringify({
              userId,
              subscription,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save subscription");
        }
        console.log("Subscription saved.");
      } catch (error) {
        console.error("Failed to save subscription:", error);
      }
    } else {
      console.error("Notification permission denied.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "https://tumbledrybe.sharda.co.in/api/auth/login",
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
            `https://tumbledrybe.sharda.co.in/api/users/${user._id}`,
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

      // Call the subscribeToPushNotifications function after login
      subscribeToPushNotifications(fullUser._id, token);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Decorative header */}
        <div
          className={`h-2 ${
            isAdminLogin
              ? "bg-gradient-to-r from-purple-600 to-indigo-600"
              : "bg-gradient-to-r from-blue-500 to-cyan-400"
          }`}
        ></div>

        <div className="p-8">
          {/* Logo/Title */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isAdminLogin ? "bg-purple-100" : "bg-blue-100"
              } shadow-inner`}
            >
              {isAdminLogin ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
            {isAdminLogin ? "Admin Portal" : "Welcome Back"}
          </h2>
          <p className="text-center text-gray-500 mb-8">
            {isAdminLogin ? "Secure system access" : "Login to continue"}
          </p>

          {/* Role toggle */}
          <div className="mb-8">
            <div className="relative flex items-center bg-gray-100 rounded-full p-1">
              <button
                type="button"
                onClick={() => setIsAdminLogin(true)}
                className={`relative flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
                  isAdminLogin
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setIsAdminLogin(false)}
                className={`relative flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isAdminLogin
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                User
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {isAdminLogin ? "Admin ID" : "Email or Username"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  id="userId"
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder={
                    isAdminLogin ? "admin@example.com" : "you@example.com"
                  }
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaChange}
            />

            <div>
              <button
                type="submit"
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
                  isAdminLogin
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all`}
              >
                Log in
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
