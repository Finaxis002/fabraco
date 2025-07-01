import { configureStore } from '@reduxjs/toolkit';
import caseReducer from './features/caseSlice';
import userReducer from './features/userSlice';
import permissionsReducer from "./features/permissionsSlice";
import authReducer from "./features/authSlice"; // Add this import
import serviceReducer from './features/ServiceSlice'; // Import the service reducer

export const store = configureStore({
  reducer: {
    case: caseReducer,
    users: userReducer,
    permissions: permissionsReducer,
    auth: authReducer, // Add this reducer
    service: serviceReducer, // Add the service reducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;