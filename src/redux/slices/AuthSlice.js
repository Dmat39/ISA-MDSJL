import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // token: null, // Comentado temporalmente - aplicar más adelante
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      // const { token, ...userData } = action.payload; // Comentado temporalmente
      // state.user = userData;
      // state.token = token;
      
      // Versión sin token (temporal)
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
      // state.token = null; // Comentado temporalmente
    },
    replaceState(_, action) {
      return action.payload;
    },
  },
});

export const { setUser, clearUser, replaceState } = authSlice.actions;

export default authSlice.reducer;
