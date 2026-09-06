import axios from 'axios';
import { jwtService } from './jwtService';
import { authService } from './authService';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            if (jwtService.isTokenExpired(token)) {
                authService.logout();
                return Promise.reject(new Error("Token expired"));
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
        if (error.response && error.response.status === 401) {
            authService.logout();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;