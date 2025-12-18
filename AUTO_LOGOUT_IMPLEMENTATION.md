# Auto Logout Implementation Guide

## Overview
This document explains the auto logout functionality that has been implemented to automatically log users out after 24 hours of inactivity.

## Completed Implementation

### 1. Auth Utilities (`src/utils/authUtils.ts`)
- **setLoginTime()**: Sets the login timestamp when user successfully logs in
- **updateActivityTime()**: Updates the last activity timestamp 
- **getTimeSinceLastActivity()**: Calculates time since last user activity
- **shouldAutoLogout()**: Checks if 24 hours have passed since last activity
- **performLogout()**: Clears authentication data and redirects to login
- **checkAndHandleAutoLogout()**: Main function that checks and performs logout if needed

### 2. Auto Logout Hook (`src/hooks/useAutoLogout.ts`)
- **useAutoLogout()**: Custom React hook that:
  - Tracks user activity (mouse, keyboard, scroll, touch events)
  - Sets up 24-hour timeout for auto logout
  - Performs periodic checks every 5 minutes
  - Provides manual logout function

### 3. Updated Login Component (`src/pages/Login.tsx`)
- Added import for `setLoginTime` from auth utilities
- Added `setLoginTime()` call after successful authentication
- This ensures login time is tracked when users log in

### 4. Updated Protected Route (`src/components/routes/ProtectedRoute.tsx`)
- Added import for `checkAndHandleAutoLogout`
- Added auto logout check before rendering protected content
- Automatically redirects to login if timeout has been exceeded

## Manual Steps Required

### App.tsx Updates (Manual Implementation Required)
To complete the implementation, you need to manually add these changes to `src/App.tsx`:

1. **Add Import** (around line 25):
```typescript
import { useAutoLogout } from "@/hooks/useAutoLogout";
```

2. **Add Hook Usage** (around line 52, after `const dispatch = useDispatch<AppDispatch>()`):
```typescript
// Initialize auto logout functionality
useAutoLogout();
```

## How It Works

1. **Login**: When user successfully logs in, `setLoginTime()` is called to record the login timestamp
2. **Activity Tracking**: The `useAutoLogout` hook tracks user activity and updates `lastActivityTime`
3. **Timeout Check**: 
   - Protected routes check for timeout on every render
   - Periodic checks run every 5 minutes
   - Activity events reset the 24-hour timer
4. **Auto Logout**: When 24 hours of inactivity is detected:
   - All authentication data is cleared from localStorage
   - User is automatically redirected to the login page

## Configuration

- **Timeout Duration**: 24 hours (configurable in `authUtils.ts`)
- **Check Interval**: 5 minutes (configurable in `useAutoLogout.ts`)
- **Activity Events**: mouse, keyboard, scroll, touch, and click events

## Testing

To test the auto logout functionality:

1. Log into the application
2. Wait for 24 hours of inactivity, OR
3. Manually modify the `lastActivityTime` in localStorage to simulate timeout
4. Navigate to any protected route - you should be redirected to login

## Notes

- The implementation uses localStorage to persist login and activity times
- Activity tracking covers all common user interaction events
- The system is designed to be non-intrusive and only logs out when truly inactive
- Manual logout is still available through the `logout` function returned by the hook