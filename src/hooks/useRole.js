import { useSelector } from 'react-redux';

export const useRole = () => {
    const { user } = useSelector((state) => state.auth);
    
    const userRole = user?.rol || user?.role;
    
    const hasRole = (roles) => {
        if (!userRole) return false;
        if (typeof roles === 'string') return userRole === roles;
        if (Array.isArray(roles)) return roles.includes(userRole);
        return false;
    };
    
    const isSupervisor = () => hasRole('supervisor');
    const isAdministrador = () => hasRole('administrador');
    const canAccessHistorial = () => hasRole(['supervisor', 'administrador']);
    
    return {
        userRole,
        hasRole,
        isSupervisor,
        isAdministrador,
        canAccessHistorial
    };
};

export default useRole;