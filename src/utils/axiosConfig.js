import axios from 'axios';
import { handleResponseError } from './axiosInterceptors';

// Variable global para almacenar el token
let globalToken = null;

// Función para actualizar el token globalmente
export const setToken = (token) => {
  globalToken = token;
  if (import.meta.env.DEV) {
    console.log('Token global actualizado:', token ? 'Sí' : 'No');
  }
};

// Función para obtener el token actual
export const getToken = () => globalToken;

// Función para limpiar el token
export const clearToken = () => {
  globalToken = null;
  if (import.meta.env.DEV) {
    console.log('Token global limpiado');
  }
};

// Configuración base para la API principal
const config = axios.create({
  baseURL: import.meta.env.VITE_APP_ENDPOINT,
  timeout: 60000,
});

// Configuración específica para el endpoint de incidencias
const incidenceConfig = axios.create({
  baseURL: import.meta.env.VITE_APP_ENDPOINT_PRUEBA,
  timeout: 70000, // Aumentado a 70 segundos para dar más tiempo al envío
});

// Función para agregar el token de autenticación
const addAuthToken = (config) => {
  if (globalToken) {
    config.headers.Authorization = `Bearer ${globalToken}`;
  }
  return config;
};

// Interceptor para agregar token automáticamente
config.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});

incidenceConfig.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error);
});





// Aplicar interceptor de respuesta a ambas configuraciones
config.interceptors.response.use(
  (response) => response,
  handleResponseError
);

incidenceConfig.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// Exportar ambas configuraciones
export const mainApi = config;
export const incidenceApi = incidenceConfig;

export default config; 