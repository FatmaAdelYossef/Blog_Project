
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { useAuth } from '../context/AuthContext';

export const AuthGuard = ({ isPublicOnly }) => {
    const { isAuthenticated } = useAuth();

    if (isPublicOnly && isAuthenticated) {
        return <Navigate to={ROUTES.HOME} />;
    }

    if (!isPublicOnly && !isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} />;
    }

    return <Outlet />;
};
