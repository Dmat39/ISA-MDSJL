import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
//import Error403 from '../Pages/Error403';


const PrivateRouter = ({ element }) => {
    const { user, token } = useSelector((state) => state.auth);

    // Verificar si hay usuario y token válidos
    if (!user || !token) {
        return <Navigate to="/verificacion" replace />;
    }

    return element;
}

export default PrivateRouter;