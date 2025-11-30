import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
});

let tokenCache = null;

export function setApiToken(token) {
    tokenCache = token || null;

    if (token) {
        api.defaults.headers = api.defaults.headers || {};
        api.defaults.headers.common = api.defaults.headers.common || {};
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        if (api.defaults?.headers?.common) {
            delete api.defaults.headers.common['Authorization'];
        }
    }
}

api.interceptors.request.use(
    (config) => {
        if (tokenCache) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${tokenCache}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isTokenInvalid =
            error.response?.data?.code === 'token_not_valid' ||
            (error.response?.status === 401 && !originalRequest._retry);

        const isRefreshEndpoint = originalRequest?.url?.includes('/api/token/refresh/');

        if (isTokenInvalid && !originalRequest._retry && !isRefreshEndpoint) {
            originalRequest._retry = true;

            try {
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
                if (!refresh) throw new Error('No refresh token available');

                const res = await api.post('/api/token/refresh/', { refresh });

                const newAccess = res.data?.access;
                if (!newAccess) throw new Error('No access token returned from refresh');

                await AsyncStorage.setItem(ACCESS_TOKEN, newAccess);
                setApiToken(newAccess);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                return api(originalRequest);
            } 
            catch (refreshError) {
                try {
                    await AsyncStorage.removeItem(ACCESS_TOKEN);
                    await AsyncStorage.removeItem(REFRESH_TOKEN);
                } catch (e) {
                    console.log('Failed to refresh token: ', e)
                }
                setApiToken(null);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;