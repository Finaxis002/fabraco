import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";

// 👇 Define your User type
export interface User {
  id: string;
  userId: string;
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  dataAIHint?: string;
}

// 👇 Define User roles
export type UserRole = "Admin" | "User"; // adjust according to your app

// Base URL

// Async Thunks
export const getAllUsers = createAsyncThunk<User[]>(
  "/users/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axiosInstance.get("/users", {
      });
      return response.data;
    } catch (error: any) {
      console.error("getAllUsers error", error.response || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const addUser = createAsyncThunk<
  User,
  Omit<User, "_id" | "avatarUrl" | "dataAIHint">
>("/users/add", async (userData) => {
  const response = await axiosInstance.post("/users/add", userData);
  return response.data;
});

export const editUser = createAsyncThunk<
  User,
  { id: string; user: Partial<User> }
>("/users/edit", async ({ id, user }) => {
  const response = await axiosInstance.put(`/users/${id}`, user);
  return response.data;
});

export const deleteUser = createAsyncThunk<string, string>(
  "/users/delete",
  async (id) => {
    await axiosInstance.delete(`/users/${id}`);
    return id;
  }
);


export const fetchCurrentUser = createAsyncThunk<
  { user: User; permissions: Permissions },
  void,
  { rejectValue: string }
>("users/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return rejectWithValue("Missing user");

    const user = JSON.parse(userString);
    const userId = user?._id || user?.id || user?.userId;
    const res = await axiosInstance.get(`/users/${userId}`);

    if (!res.data) return rejectWithValue("No user data returned");

    // Map old keys to new keys if backend is still using old ones
    const permsFromBackend = res.data.permissions || {};
    const mappedPermissions: Permissions = {
      allCaseAccess: permsFromBackend.allCaseAccess ?? permsFromBackend.canCreate ?? false,
      viewRights: permsFromBackend.viewRights ?? permsFromBackend.canViewReports ?? false,
      createCaseRights: permsFromBackend.createCaseRights ?? permsFromBackend.canCreate ?? false,
      createUserRights: permsFromBackend.createUserRights ?? false,
      userRolesAndResponsibility: permsFromBackend.userRolesAndResponsibility ?? false,
      delete: permsFromBackend.delete ?? permsFromBackend.canDelete ?? false,
      edit: permsFromBackend.edit ?? permsFromBackend.canEdit ?? false,
      remarksAndChat: permsFromBackend.remarksAndChat ?? false,
    };

    return {
      user: res.data,
      permissions: mappedPermissions,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch current user");
  }
});



// State shape
interface UserState {
  users: User[];
  currentUser: User | null; // For logged-in user data
  permissions: Permissions | null; // For logged-in user's permissions
  loading: boolean;
  error: string | null;
}

interface Permissions {
  allCaseAccess: boolean;
  viewRights: boolean;
  createCaseRights: boolean;
  createUserRights: boolean;
  userRolesAndResponsibility: boolean;
  delete: boolean;
  edit: boolean;
  remarksAndChat: boolean;
}


const defaultPermissions: Permissions = {
  allCaseAccess: false,
  viewRights: false,
  createCaseRights: false,
  createUserRights: false,
  userRolesAndResponsibility: false,
  delete: false,
  edit: false,
  remarksAndChat: false,
};

const initialState: UserState = {
  users: [],
  currentUser: null,
  permissions: defaultPermissions,
  loading: false,
  error: null,
};

// Slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUsers: (state) => {
      state.users = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        getAllUsers.fulfilled,
        (state, action: PayloadAction<User[]>) => {
          state.loading = false;
          state.users = action.payload;
        }
      )
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
      })

      // Add
      .addCase(addUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.unshift(action.payload);
      })

      // Edit
      .addCase(editUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(
          (u) => u._id === action.payload._id
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.users = state.users.filter((user) => user._id !== action.payload);
      })

      // Current user fetch
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.permissions = action.payload.permissions;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load current user";
        state.currentUser = null;
        state.permissions = null;
      });
  },
});

export const { resetUsers } = userSlice.actions;
export default userSlice.reducer;
