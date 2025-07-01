// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    _id: string;
    name: string;
    // other user properties
  } | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;