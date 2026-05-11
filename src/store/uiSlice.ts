import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarCollapsed: boolean;
  systemStatus: "operational" | "degraded" | "critical" | "outage";
}

const initialState: UIState = {
  sidebarCollapsed: false,
  systemStatus: "critical",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setSystemStatus: (state, action: PayloadAction<UIState["systemStatus"]>) => {
      state.systemStatus = action.payload;
    },
  },
});

export const { toggleSidebar, setSystemStatus } = uiSlice.actions;
export default uiSlice.reducer;
