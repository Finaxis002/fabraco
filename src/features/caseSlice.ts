import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { Case } from "@/types/franchise";
import axiosInstance from "@/utils/axiosInstance";

export const addCase = createAsyncThunk(
  "case/addCase",
  async (caseData: Omit<Case, "id">, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/cases/add", caseData);
      return response.data.case;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add case"
      );
    }
  }
);

export const getCases = createAsyncThunk(
  "case/getCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/cases");
      return response.data; // Assuming API returns array of cases
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cases"
      );
    }
  }
);

// New: Delete Case
export const deleteCase = createAsyncThunk(
  "case/deleteCase",
  async (caseId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // or wherever you store it
      await axiosInstance.delete(`/cases/${caseId}`);
      return caseId; // Return deleted case id for reducer
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete case"
      );
    }
  }
);

export const updateCase = createAsyncThunk(
  "case/updateCase",
  async (caseData: Case, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // get token from localStorage

      const response = await axiosInstance.put(
        `/cases/${caseData.id}`,
        caseData
      );
      return response.data.case;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update case"
      );
    }
  }
);

// ✅ Define initial state
interface CaseState {
  cases: Case[];
  loading: boolean;
  error: string | null;
}

const initialState: CaseState = {
  cases: [],
  loading: false,
  error: null,
};

const caseSlice = createSlice({
  name: "case",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Add Case
      .addCase(addCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCase.fulfilled, (state, action) => {
        state.cases.push(action.payload);
        state.loading = false;
      })
      .addCase(addCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Cases
      .addCase(getCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCases.fulfilled, (state, action) => {
        // 👇 Normalize _id to id for frontend use
        state.cases = action.payload.map((c: any) => ({
          ...c,
          id: c._id, // 👈 this makes sure caseData.id works
        }));
        state.loading = false;
      })
      .addCase(getCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Case
      .addCase(deleteCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.cases = state.cases.filter((c) => c.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default caseSlice.reducer;
