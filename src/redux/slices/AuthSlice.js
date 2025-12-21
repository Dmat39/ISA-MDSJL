import { createSlice } from '@reduxjs/toolkit';
import { setToken, clearToken } from '../../utils/axiosConfig';

// Cargar estado inicial desde localStorage
const loadInitialState = () => {
  try {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      // Restaurar token global si existe
      if (parsed.token) {
        setToken(parsed.token);
      }
      return parsed;
    }
  } catch (error) {
    // Error silencioso en producción
  }
  return {
    token: null,
    user: null,
  };
};

const initialState = loadInitialState();

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
      // Guardar en localStorage
      localStorage.setItem('auth', JSON.stringify({ token, user: data }));
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      // Limpiar token global para evitar requests con credenciales previas
      clearToken();
      // Limpiar localStorage
      localStorage.removeItem('auth');
    },
    // Nueva acción para manejar token expirado
    handleTokenExpired(state) {
      state.user = null;
      state.token = null;
      clearToken();
      localStorage.removeItem('auth');
    },
    replaceState(_, action) {
      return action.payload;
    },
  },
});

export const { setUser, clearUser, handleTokenExpired, replaceState } = authSlice.actions;

export default authSlice.reducer;
