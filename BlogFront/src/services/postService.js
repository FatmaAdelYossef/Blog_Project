
import API_ENDPOINTS from '../config/apiEndpoints';
import axiosInstance from './axiosConfig';

export const postService = {
    getAllPosts: async (pageNumber = 1, pageSize = 10, categoryId = '', title = '') => {
        const params = new URLSearchParams({
            pageNumber,
            pageSize
        });

        if (categoryId !== '' && categoryId !== null && categoryId !== undefined) {
            params.append('categoryId', categoryId);
        }

        if (title && title.trim() !== '') {
            params.append('title', title.trim());
        }

        const response = await axiosInstance.get(`${API_ENDPOINTS.POSTS.BASE}?${params.toString()}`);
        return response.data;
    },

    getPostById: async (id) => {
        const response = await axiosInstance.get(API_ENDPOINTS.POSTS.BY_ID(id));
        return response.data;
    },

    createPost: async (postData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.POSTS.BASE, postData);
        return response.data;
    },

    updatePost: async (id, postData) => {
        const response = await axiosInstance.put(API_ENDPOINTS.POSTS.BY_ID(id), postData);
        return response.data;
    },

    addMediaToPost: async (postId, mediaData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.POSTS.ADD_MEDIA(postId), mediaData);
        return response.data;
    },

    updateMediaToPost: async (mediaId, mediaData) => {
        const response = await axiosInstance.put(API_ENDPOINTS.POSTS.UPDATE_MEDIA(mediaId), mediaData);
        return response.data;
    },

    deletePost: async (id) => {
        const response = await axiosInstance.delete(API_ENDPOINTS.POSTS.BY_ID(id));
        return response.data;
    },

    deleteMedia: async (mediaId) => {
        const response = await axiosInstance.delete(`${API_ENDPOINTS.POSTS.BASE}/Media/${mediaId}`);
        return response.data;
    }
};