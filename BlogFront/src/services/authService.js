
import axiosInstance from './axiosConfig';
import API_ENDPOINTS from '../config/apiEndpoints';
import { ROUTES } from '../config/routes';

export const authService = {

    login: async (credentials) => {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
        if (response.data.data) {
            localStorage.setItem('token', response.data.data);
        }
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
        localStorage.clear();
        // window.location.href = `${ROUTES.LOGIN}`;
    }

};