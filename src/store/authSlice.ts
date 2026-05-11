import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: { name: string; email: string; role: string; initials: string } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: {
    name: "Kwame Asante",
    email: "k.asante@mindr.network",
    role: "Level 4 Clearance",
    initials: "KA",
  },
  isAuthenticated: true,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
