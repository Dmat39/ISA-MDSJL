import { BottomNavigation, BottomNavigationAction } from '@mui/material';
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
  const isLoggingOut = useRef(false);

  const handleLogout = () => {
    // Evitar múltiples clics
    if (isLoggingOut.current) {
      return;
    }

    isLoggingOut.current = true;

    // Limpiar datos de Redux (esto también limpia localStorage)
    dispatch(clearUser());

    // Forzar navegación después de que Redux actualice
    setTimeout(() => {
      navigate('/verificacion', { replace: true });
      // Forzar recarga completa para limpiar cualquier estado residual
      window.location.href = '/verificacion';
    }, 100);
  };

  useEffect(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) setValue(index);
  }, [location.pathname]);



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
      onChange={(_, newValue) => {
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
          icon={item.icon}
        />
      ))}
    </BottomNavigation>
  );
};

export default Navbar;
