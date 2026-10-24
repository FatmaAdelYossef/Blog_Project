import API_ENDPOINTS from "../config/apiEndpoints";
import axiosInstance from "./axiosConfig";


export const categoryService = {

    getAll: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.CATEGORY.BASE);
        return response.data;
    },

    getById: async (id) => {
        const response = await axiosInstance.get(`${API_ENDPOINTS.CATEGORY.BASE}/${id}`);
        return response.data;
    },

    create: async (categoryData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.CATEGORY.BASE, categoryData);
        return response.data;
    },

    update: async (id, categoryData) => {
        const response = await axiosInstance.put(`${API_ENDPOINTS.CATEGORY.BASE}/${id}`, categoryData);
        return response.data;
    },

    delete: async (id) => {
        const response = await axiosInstance.delete(`${API_ENDPOINTS.CATEGORY.BASE}/${id}`);
        return response.data;
    }

};