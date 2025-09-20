import { handleTokenExpired } from '../redux/slices/AuthSlice';

let store = null;
let isRedirecting = false;

// Función para configurar el store
export const setStore = (storeInstance) => {
  store = storeInstance;
};

// Interceptor mejorado para manejar respuestas de error
export const handleResponseError = (error) => {
  // Manejo específico de errores de timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    console.error('Error de timeout:', {
      url: error.config?.url,
      method: error.config?.method,
      message: 'Tiempo de envío superado, por favor verifique su conexión a internet.'
    });
  } else if (error.response?.status === 401) {
    console.warn('Token expirado o inválido detectado');
    
    // Evitar múltiples redirecciones simultáneas
    if (!isRedirecting && store) {
      isRedirecting = true;
      
      // Dispatch de la acción para limpiar el estado
      store.dispatch(handleTokenExpired());
      
      // Usar setTimeout para evitar conflictos con el estado de React
      setTimeout(() => {
        if (window.location.pathname !== '/verificacion') {
          console.log('Redirigiendo a /verificacion debido a token expirado');
          window.location.replace('/verificacion');
        }
        // Reset del flag después de la redirección
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }, 100);
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