// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';

// const api = axios.create({
//     baseURL: process.env.EXPO_PUBLIC_API_URL,
// });

// // Attach access token to all requests
// api.interceptors.request.use(async (config) => {
//     const token = await AsyncStorage.getItem(ACCESS_TOKEN);
//     console.log("Interceptor: Token retrieved from AsyncStorage:", token ? "Exists" : "Does not exist");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
// }, (error) => Promise.reject(error));

// // Handle expired access tokens
// api.interceptors.response.use(
//     response => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (error.response?.data?.code === 'token_not_valid' && !originalRequest._retry) {
//             originalRequest._retry = true;

//             const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
//             if (refresh) {
//                 try {
//                     const res = await api.post('/api/token/refresh/', { refresh });
//                     const newAccess = res.data.access;
//                     await AsyncStorage.setItem(ACCESS_TOKEN, newAccess);

//                     // Update headers for retry
//                     originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
//                     return api(originalRequest); // Retry original request
//                 } catch (refreshError) {
//                     // Refresh failed → logout
//                     await AsyncStorage.removeItem(ACCESS_TOKEN);
//                     await AsyncStorage.removeItem(REFRESH_TOKEN);
//                     return Promise.reject(refreshError);
//                 }
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Module-level token cache to avoid reading AsyncStorage on every request
let tokenCache = null;

/**
 * Set or clear the API access token for all requests.
 * Call this from AuthContext when you load / set / clear tokens.
 */
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



// Attach cached access token to all requests (no AsyncStorage reads here)
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

// Handle expired access tokens by attempting a refresh once per original request
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ensure there is a response and token invalid code, and we haven't retried yet
        const isTokenInvalid =
            error.response?.data?.code === 'token_not_valid' ||
            (error.response?.status === 401 && !originalRequest._retry);

        // Prevent trying to refresh when the failing request is the refresh endpoint itself
        const isRefreshEndpoint = originalRequest?.url?.includes('/api/token/refresh/');

        if (isTokenInvalid && !originalRequest._retry && !isRefreshEndpoint) {
            originalRequest._retry = true;

            try {
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
                if (!refresh) throw new Error('No refresh token available');

                // Request a new access token using the refresh token
                const res = await api.post('/api/token/refresh/', { refresh });

                const newAccess = res.data?.access;
                if (!newAccess) throw new Error('No access token returned from refresh');

                // Persist new access token and update module cache + axios defaults
                await AsyncStorage.setItem(ACCESS_TOKEN, newAccess);
                setApiToken(newAccess);

                // Update original request header and retry
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — clear stored tokens and token cache
                try {
                    await AsyncStorage.removeItem(ACCESS_TOKEN);
                    await AsyncStorage.removeItem(REFRESH_TOKEN);
                } catch (e) {
                    // ignore storage cleanup errors
                }
                setApiToken(null);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;