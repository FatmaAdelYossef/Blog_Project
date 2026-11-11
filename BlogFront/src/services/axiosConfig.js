import axios from 'axios';
import { jwtService } from './jwtService';
import {
    clearToken,
    clearTokens,
    getRefreshToken,
    getToken,
    setRefreshToken,
    setToken,
} from '../lib/tokenStorage';
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

// Single-flight refresh: concurrent 401s share one refresh call so the
// rotating refresh token is never used twice in parallel.
let refreshPromise = null;

const refreshTokens = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available.');
    }

    // Plain axios, not axiosInstance: the refresh call must not recurse
    // through this interceptor stack.
    const response = await axios.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const data = response.data?.data;

    if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Malformed refresh response.');
    }

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    // AuthContext keeps its own copy of the access token; tell it to re-read.
    window.dispatchEvent(new Event('auth:token-refreshed'));
    return data.accessToken;
};

const getRefreshPromise = () => {
    if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (token) {
            if (jwtService.isTokenExpired(token)) {
                // Drop the stale access token but keep the session alive: the
                // 401 handler will refresh and retry. Without a refresh token
                // the session is truly over.
                clearToken();
                if (!getRefreshToken()) {
                    notifyLogout();
                    return Promise.reject(new Error('Session expired. Please log in again.'));
                }
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

        if (status !== 401 || isSilentAuthUrl(url)) {
            return Promise.reject(error);
        }

        if (error.config?._retried) {
            // Already retried once after a refresh — the session is invalid.
            clearTokens();
            notifyLogout();
            return Promise.reject(error);
        }

        if (!getRefreshToken()) {
            clearTokens();
            notifyLogout();
            return Promise.reject(error);
        }

        try {
            await getRefreshPromise();
        } catch {
            clearTokens();
            notifyLogout();
            return Promise.reject(error);
        }

        error.config._retried = true;
        return axiosInstance(error.config);
    }
);

export default axiosInstance;
