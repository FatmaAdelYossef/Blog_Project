import API_ENDPOINTS from '../config/apiEndpoints';
import axiosInstance from './axiosConfig';

const unwrap = (response) => response.data?.data ?? response.data;

export const siteSettingsService = {
  get: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.SITE_SETTINGS);
    return unwrap(response);
  },

  update: async (settings) => {
    const response = await axiosInstance.put(API_ENDPOINTS.SITE_SETTINGS, settings);
    return unwrap(response);
  },
};
