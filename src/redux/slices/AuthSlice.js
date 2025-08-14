import { createSlice } from '@reduxjs/toolkit';
import { setToken, clearToken } from '../../utils/axiosConfig';

const initialState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      const { token, data } = action.payload;
      state.user = data;
      state.token = token;
      // Sincronizar token global
      setToken(token);
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      // Limpiar token global para evitar requests con credenciales previas
      clearToken();
    },
    replaceState(_, action) {
      return action.payload;
    },
  },
});

export const { setUser, clearUser, replaceState } = authSlice.actions;

export default authSlice.reducer;
