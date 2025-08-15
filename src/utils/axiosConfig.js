import axios from 'axios';

// Variable global para almacenar el token
let globalToken = null;

// Función para actualizar el token globalmente
export const setToken = (token) => {
  globalToken = token;
  console.log('Token global actualizado:', token ? 'Sí' : 'No');
};

// Función para obtener el token actual
export const getToken = () => globalToken;

// Función para limpiar el token
export const clearToken = () => {
  globalToken = null;
  console.log('Token global limpiado');
};

// Configuración base para la API principal
const config = axios.create({
  baseURL: import.meta.env.VITE_APP_ENDPOINT,
  timeout: 60000,
});

// Configuración específica para el endpoint de incidencias
const incidenceConfig = axios.create({
  baseURL: import.meta.env.VITE_APP_ENDPOINT_PRUEBA,
  timeout: 60000,
});

// Función para agregar el token de autenticación
const addAuthToken = (config) => {
  if (globalToken) {
    config.headers.Authorization = `Bearer ${globalToken}`;
    console.log('Token agregado a petición:', config.url);
  } else {
    console.warn('No hay token disponible para:', config.url);
  }
  return config;
};

// Interceptor para agregar token automáticamente
config.interceptors.request.use(addAuthToken, (error) => {
  console.error('Error en interceptor de request (main):', error);
  return Promise.reject(error);
});

incidenceConfig.interceptors.request.use(addAuthToken, (error) => {
  console.error('Error en interceptor de request (incidence):', error);
  return Promise.reject(error);
});

// Interceptor para manejar respuestas de error 
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    console.warn('Token expirado o inválido. Limpiando token global...');
    clearToken();
    // Redirigir al login si es necesario
    if (window.location.pathname !== '/verificacion') {
      window.location.href = '/verificacion';
    }
  } else if (error.response?.status === 400) {
    console.error('❌ Error 400 - Bad Request:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      response: error.response?.data,
      message: error.message
    });
  } else if (error.response?.status >= 500) {
    console.error('❌ Error del servidor:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
  }
  return Promise.reject(error);
};

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