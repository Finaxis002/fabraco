// utils/authUtils.ts
import { useNavigate } from 'react-router-dom';

// Constants for timeout handling
export const AUTO_LOGOUT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const LOGIN_TIME_KEY = 'loginTime';
const ACTIVITY_TIME_KEY = 'lastActivityTime';

// Set login time when user successfully logs in
export const setLoginTime = () => {
  const loginTime = Date.now();
  localStorage.setItem(LOGIN_TIME_KEY, loginTime.toString());
  localStorage.setItem(ACTIVITY_TIME_KEY, loginTime.toString());
};

// Update last activity time
export const updateActivityTime = () => {
  const currentTime = Date.now();
  localStorage.setItem(ACTIVITY_TIME_KEY, currentTime.toString());
};

// Get time since last activity
export const getTimeSinceLastActivity = (): number => {
  const lastActivityStr = localStorage.getItem(ACTIVITY_TIME_KEY);
  if (!lastActivityStr) return Infinity;
  
  const lastActivity = parseInt(lastActivityStr, 10);
  return Date.now() - lastActivity;
};

// Check if auto logout should trigger
export const shouldAutoLogout = (): boolean => {
  const timeSinceLastActivity = getTimeSinceLastActivity();
  return timeSinceLastActivity >= AUTO_LOGOUT_TIMEOUT;
};

// Perform logout action
export const performLogout = (navigate?: ReturnType<typeof useNavigate>) => {
  // Clear all authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
  localStorage.removeItem(LOGIN_TIME_KEY);
  localStorage.removeItem(ACTIVITY_TIME_KEY);
  
  // Redirect to login page
  if (navigate) {
    navigate('/login', { replace: true });
  } else {
    // Fallback for cases where navigate is not available
    window.location.href = '/login';
  }
};

// Check and handle auto logout if needed
export const checkAndHandleAutoLogout = (navigate?: ReturnType<typeof useNavigate>) => {
  const token = localStorage.getItem('token');
  
  // Only proceed if user is logged in
  if (token && shouldAutoLogout()) {
    performLogout(navigate);
    return true; // Indicates logout was performed
  }
  
  return false; // Indicates no logout was needed
};