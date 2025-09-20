import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';

const RoleProtectedRoute = ({ element, allowedRoles = [] }) => {
    const { user } = useSelector((state) => state.auth);

    // Si no hay usuario, redirigir a verificación
    if (!user) {
        return <Navigate to="/verificacion" replace />;
    }

    // Si no hay roles permitidos, permitir acceso
    if (allowedRoles.length === 0) {
        return element;
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    const userRole = user.rol || user.role;
    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
        // Redirigir a la página principal si no tiene permisos
        return <Navigate to="/" replace />;
    }

    return element;
};

export default RoleProtectedRoute;