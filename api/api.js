import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Attach access token to all requests
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    console.log("Interceptor: Token retrieved from AsyncStorage:", token ? "Exists" : "Does not exist");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// Handle expired access tokens
api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.data?.code === 'token_not_valid' && !originalRequest._retry) {
            originalRequest._retry = true;

            const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
            if (refresh) {
                try {
                    const res = await api.post('/api/token/refresh/', { refresh });
                    const newAccess = res.data.access;
                    await AsyncStorage.setItem(ACCESS_TOKEN, newAccess);

                    // Update headers for retry
                    originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                    return api(originalRequest); // Retry original request
                } catch (refreshError) {
                    // Refresh failed → logout
                    await AsyncStorage.removeItem(ACCESS_TOKEN);
                    await AsyncStorage.removeItem(REFRESH_TOKEN);
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
