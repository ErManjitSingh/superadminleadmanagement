import { createSlice } from '@reduxjs/toolkit';

export const BRANCH_STORAGE_KEY = 'crm.selectedBranchId';

const initialState = {
  selectedBranchId: null,
  availableBranches: [],
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    hydrateSelectedBranch(state) {
      try {
        state.selectedBranchId = localStorage.getItem(BRANCH_STORAGE_KEY) || null;
      } catch {
        state.selectedBranchId = null;
      }
    },
    setSelectedBranch(state, action) {
      state.selectedBranchId = action.payload || null;
      try {
        if (state.selectedBranchId) localStorage.setItem(BRANCH_STORAGE_KEY, state.selectedBranchId);
        else localStorage.removeItem(BRANCH_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    },
    setAvailableBranches(state, action) {
      state.availableBranches = action.payload || [];
    },
    clearBranchState(state) {
      state.selectedBranchId = null;
      state.availableBranches = [];
      try {
        localStorage.removeItem(BRANCH_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    },
  },
});

export const {
  hydrateSelectedBranch,
  setSelectedBranch,
  setAvailableBranches,
  clearBranchState,
} = branchSlice.actions;

export default branchSlice.reducer;
