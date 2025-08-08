import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';

const PublicRouter = ({ element }) => {
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const  previusURL = location.state?.from || "/";
    
    return (
        !user ? element : <Navigate to={previusURL} />
    );
}

export default PublicRouter;