
import axiosInstance from './axiosConfig';
import API_ENDPOINTS from '../config/apiEndpoints';
import { clearTokens, getRefreshToken, setRefreshToken, setToken } from '../lib/tokenStorage';

const storeTokenPair = (data) => {
    if (data?.accessToken) {
        setToken(data.accessToken);
    }
    if (data?.refreshToken) {
        setRefreshToken(data.refreshToken);
    }
};

export const authService = {

    login: async (credentials) => {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
        storeTokenPair(response.data?.data);
        return response.data;
    },

    changePassword: async (model) => {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, model);
        return response.data;
    },

    forgotPassword: async (model) => {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, model);
        return response.data;
    },

    resetPassword: async (model) => {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, model);
        return response.data;
    },

    logout: async () => {
        // Best-effort server-side revocation; local cleanup always happens.
        const refreshToken = getRefreshToken();
        try {
            if (refreshToken) {
                await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
            }
        } catch {
            // Ignore — the token may already be expired or revoked.
        } finally {
            clearTokens();
        }
    }

};
