import { BottomNavigation, BottomNavigationAction, CircularProgress } from '@mui/material';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { clearUser } from '../../redux/slices/AuthSlice';

const navItems = [
  { label: 'Lista', value: 'list', path: '/', icon: <FormatListBulletedRoundedIcon /> },
  { label: 'Nueva', value: 'new', path: '/nueva', icon: <AddRoundedIcon /> },
  { label: 'Salir', value: 'logout', path: null, icon: <LogoutRoundedIcon /> },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef(null);

  const handleLogout = async () => {
    // Prevenir múltiples clicks
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      // Limpiar cualquier timeout pendiente
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
      
      // Limpiar datos del usuario del Redux store
      dispatch(clearUser());
      
      // Limpiar localStorage y sessionStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      localStorage.removeItem('persist:root');
      sessionStorage.clear();
      
      // Limpiar cualquier cache del navegador relacionado
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (cacheError) {
          console.warn('Error limpiando cache:', cacheError);
        }
      }
      
      // Redirigir usando navigate para evitar recarga completa
      navigate('/verificacion', { replace: true });
      
    } catch (error) {
      console.error('Error durante logout:', error);
      // En caso de error, redirigir igualmente sin recargar
      navigate('/verificacion', { replace: true });
    }
  };

  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) setValue(index);
  }, [location.pathname]);

  // Cleanup timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  return (
    <BottomNavigation
      className='shadow-[0_-1px_3px_-1px_rgba(0,0,0,0.2)]'
      showLabels
      value={value}
      sx={{
        height: '56px',
        minHeight: '56px',
        maxHeight: '56px',
        borderTop: '1px solid #e5e7eb'
      }}
             onChange={(event, newValue) => {
         const selectedItem = navItems[newValue];
         if (selectedItem.value === 'logout') {
           handleLogout();
           // No cambiar el valor del estado para logout
           return;
         } else {
           setValue(newValue);
           navigate(selectedItem.path);
         }
       }}
    >
             {navItems.map((item) => (
         <BottomNavigationAction
           key={item.value}
           label={item.label}
           icon={item.value === 'logout' && isLoggingOut ? <CircularProgress size={20} /> : item.icon}
           disabled={item.value === 'logout' && isLoggingOut}
         />
       ))}
    </BottomNavigation>
  );
};

export default Navbar;
