import API_ENDPOINTS from "../config/apiEndpoints";
import axiosInstance from "./axiosConfig";



export const uploadService = {
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post(API_ENDPOINTS.UPLOAD.IMAGE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.data.fileName || response.data;
    },

    getDownloadUrl: (fileName) => {
        return `${axiosInstance.defaults.baseURL}/Upload/download/${fileName}`;
    }
};