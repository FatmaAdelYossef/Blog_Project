import axios from 'axios';
import { jwtService } from './jwtService';
import { clearToken, getToken } from '../lib/tokenStorage';
import API_ENDPOINTS from '../config/apiEndpoints';

const axiosInstance = axios.create();

// Unauthenticated auth flows must not force a global logout on 401: a failed
// login would otherwise emit auth:logout. Change-password is intentionally not
// in this list because it requires an authenticated session.
const SILENT_401_URLS = new Set([
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
]);

const notifyLogout = () => {
    window.dispatchEvent(new Event('auth:logout'));
};

const isSilentAuthUrl = (url = '') => SILENT_401_URLS.has(url.split('?')[0]);

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (token) {
            if (jwtService.isTokenExpired(token)) {
                clearToken();
                notifyLogout();
                return Promise.reject(new Error('Session expired. Please log in again.'));
            }

            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401 && !isSilentAuthUrl(error.config?.url)) {
            clearToken();
            notifyLogout();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
