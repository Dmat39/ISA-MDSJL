import React, { cloneElement } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
//import Error403 from '../Pages/Error403';


const PrivateRouter = ({ element }) => {

    const { user } = useSelector((state) => state.auth);

    if (!user) {
        return <Navigate to="/verificacion" />;
    }

    // if (!hasPermission) {
    //     return <Error403 />;
    // }

    return element;
}

export default PrivateRouter;