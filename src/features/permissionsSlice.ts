import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

// -- Types --

interface Permissions {
  allCaseAccess: boolean;
  viewRights: boolean;
  createCaseRights: boolean;
  createUserRights: boolean;
  userRolesAndResponsibility: boolean;
  delete: boolean;
  edit: boolean;
  remarks: boolean;
  chat: boolean;
  canShare: boolean;
}

interface PermissionsState {
  edit: boolean;
  permissions: Permissions | null;
  loading: boolean;
  error: string | null;
}

// -- Async thunk to fetch permissions by user ID --

export const fetchPermissions = createAsyncThunk<
  Permissions,
  string,
  { rejectValue: string }
>("permissions/fetchPermissions", async (userId, { rejectWithValue }) => {
  try {
    if (!userId) return rejectWithValue("User ID not found");

    // --- Handle "Super Admin" (change ID as per your system!) ---
    if (userId === "68271c74487f3a8ea0dd6bdd" || userId === "admin") {
      // Return ALL permissions enabled for Super Admin
      return {
        allCaseAccess: true,
        viewRights: true,
        createCaseRights: true,
        createUserRights: true,
        userRolesAndResponsibility: true,
        delete: true,
        edit: true,
        remarks: true,
        chat: true,
        canShare: true,
      };
    }

    // --- Normal user: fetch from `/users/:userId` and extract .permissions ---
    const res = await axiosInstance.get(`/users/${userId}`);

    if (!res.data || !res.data.permissions)
      return rejectWithValue("No user permissions found");

    return res.data.permissions as Permissions;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || error.message || "Failed to fetch permissions"
    );
  }
});

// -- Slice setup --

const initialState: PermissionsState = {
  permissions: null,
  loading: false,
  error: null,
  edit: false,
};

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    resetPermissions: (state) => {
      state.permissions = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPermissions.fulfilled,
        (state, action: PayloadAction<Permissions>) => {
          state.loading = false;
          state.permissions = action.payload;
        }
      )
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch permissions";
        state.permissions = null;
      });
  },
});

export const { resetPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;
