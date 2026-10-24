
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { jwtService } from '../services/jwtService';

export const AuthGuard = ({ isPublicOnly }) => {
    const token = localStorage.getItem('token');

    const isValid = token && !jwtService.isTokenExpired(token);

    if (isPublicOnly && isValid) {
        return <Navigate to={ROUTES.HOME} />;
    }

    if (!isPublicOnly && !isValid) {
        return <Navigate to={ROUTES.LOGIN} />;
    }

    return <Outlet />;
};