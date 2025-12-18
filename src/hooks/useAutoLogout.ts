// hooks/useAutoLogout.ts
import { useEffect, useRef } from 'react';
import { updateActivityTime, checkAndHandleAutoLogout } from '@/utils/authUtils';
import { useNavigate } from 'react-router-dom';

// Event types that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle user activity
  const handleActivity = () => {
    updateActivityTime();
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for auto logout
    timeoutRef.current = setTimeout(() => {
      checkAndHandleAutoLogout(navigate);
    }, 24 * 60 * 60 * 1000); // 24 hours
  };

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Set up activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up initial timeout
    handleActivity();

    // Set up periodic check (every 5 minutes)
    activityTimeoutRef.current = setInterval(() => {
      checkAndHandleAutoLogout(navigate);
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup function
    return () => {
      // Remove activity listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [navigate]);

  // Manual logout function
  const logout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (activityTimeoutRef.current) {
      clearInterval(activityTimeoutRef.current);
    }
    checkAndHandleAutoLogout(navigate);
  };

  return { logout };
};