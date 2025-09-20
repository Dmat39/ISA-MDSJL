import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { handleTokenExpired } from '../redux/slices/AuthSlice';

const useAuthCheck = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isRedirecting = useRef(false);

  useEffect(() => {
    // Verificar si estamos en una ruta que requiere autenticación
    const isPublicRoute = location.pathname === '/verificacion';
    
    // Solo verificar si no estamos ya redirigiendo y no estamos en una ruta pública
    if (!isPublicRoute && (!user || !token) && !isRedirecting.current) {
      console.log('useAuthCheck: Token o usuario no válido, limpiando estado y redirigiendo');
      isRedirecting.current = true;
      
      dispatch(handleTokenExpired());
      
      // Usar setTimeout para evitar conflictos con otros navegadores
      setTimeout(() => {
        navigate('/verificacion', { replace: true });
        // Reset después de un tiempo
        setTimeout(() => {
          isRedirecting.current = false;
        }, 1000);
      }, 50);
    }
    
    // Reset si llegamos a la ruta pública
    if (isPublicRoute) {
      isRedirecting.current = false;
    }
  }, [user, token, location.pathname, dispatch, navigate]);

  return { isAuthenticated: !!(user && token) };
};

export default useAuthCheck;