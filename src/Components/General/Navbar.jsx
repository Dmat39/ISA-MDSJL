import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
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

  const handleLogout = () => {
    dispatch(clearUser());    
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
      onChange={(event, newValue) => {
        const selectedItem = navItems[newValue];
        if (selectedItem.value === 'logout') {
          handleLogout();
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
