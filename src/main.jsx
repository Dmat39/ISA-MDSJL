import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './routers/AppRouter'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import store from './redux/store/Store'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { setStore } from './utils/axiosInterceptors';
import { initSecurityMeasures } from './utils/security';

// Inicializar medidas de seguridad en producción
initSecurityMeasures({
  disableConsole: true, // Deshabilita console.log en producción
  detectDevTools: false, // Detectar DevTools (opcional, puede ser molesto)
  disableRightClick: false, // Deshabilitar clic derecho (opcional, afecta UX)
  disableShortcuts: false, // Deshabilitar atajos de DevTools (opcional, afecta UX)
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 días (1 semana)
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 días (mantener en cache)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configurar el store para los interceptores de Axios
setStore(store);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AppRouter />
          <Toaster richColors position='bottom-right' />
        </LocalizationProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
