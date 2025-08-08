import { useSelector } from 'react-redux';

const useUserData = () => {
    const { user } = useSelector((state) => state.auth);
    // const { user, token } = useSelector((state) => state.auth); // Comentado temporalmente
    
    return { 
        userData: user, 
        // token: token, // Comentado temporalmente
        loading: false, 
        // error: !user ? 'Usuario no autenticado' : null // Comentado temporalmente
        error: null // Sin validación de autenticación por ahora
    };
};

export default useUserData;