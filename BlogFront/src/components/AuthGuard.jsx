
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { jwtService } from '../services/jwtService';

export const AuthGuard = ({ isPublicOnly }) => {
    let token = null;
    try {
        token = localStorage.getItem('token');
    } catch {
        token = null;
    }

    const isValid = Boolean(token) && !jwtService.isTokenExpired(token);

    if (isPublicOnly && isValid) {
        return <Navigate to={ROUTES.HOME} />;
    }

    if (!isPublicOnly && !isValid) {
        return <Navigate to={ROUTES.LOGIN} />;
    }

    return <Outlet />;
};