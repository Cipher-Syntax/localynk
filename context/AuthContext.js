import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';
import { useRouter } from 'expo-router';

const AuthContext = createContext();

const initialAuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    message: null,    
    messageType: null,  // <-- added ('success', 'error', 'info')
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialAuthState);
    const router = useRouter();

    // --- Core function to fetch profile and update state ---
    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/profile/');
            return response.data;
        } catch (error) {
            console.error('Profile fetch error:', error.response?.data || error.message);
            throw error;
        }
    };

    // --- Function exposed to components to manually refresh role/data ---
    const refreshUser = async () => {
        try {
            const user = await fetchProfile();
            setState(prev => ({ 
                ...prev, 
                user, 
                isAuthenticated: true, 
                message: 'Profile refreshed.',
                messageType: 'info'
            }));
            return true;
        } catch (e) {
            console.error('Failed to refresh user profile:', e);
            return false;
        }
    };
    // -------------------------------------------------------------------

    // --- Load stored tokens and fetch profile on app startup
    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                const access = await AsyncStorage.getItem(ACCESS_TOKEN);
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);

                if (access && refresh) {
                    try {
                        const user = await fetchProfile();
                        setState({ isAuthenticated: true, user, token: access, isLoading: false });
                    } catch (error) {
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Error loading tokens:', error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };
        loadStoredUser();
    }, []);

    // --- API Calls ---

    const login = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await api.post('/api/token/', { username, password });
            const access = response.data.access;
            const refresh = response.data.refresh;

            await AsyncStorage.setItem(ACCESS_TOKEN, access);
            await AsyncStorage.setItem(REFRESH_TOKEN, refresh);

            const user = await fetchProfile();

            setState({
                isAuthenticated: true,
                user,
                token: access,
                isLoading: false,
                message: 'Login successful!',
                messageType: 'success',
            });
            return true;
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            setState(prev => ({
                ...prev,
                isLoading: false,
                message: 'Invalid username or password',
                messageType: 'error',
            }));
            return false;
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/api/register/', userData);
            setState(prev => ({
                ...prev,
                message: 'Registration successful. You can now log in.',
                messageType: 'success',
            }));
            return true;
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            setState(prev => ({
                ...prev,
                message: 'Failed to register. Please check your info.',
                messageType: 'error',
            }));
            return false;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(ACCESS_TOKEN);
            await AsyncStorage.removeItem(REFRESH_TOKEN);
            setState({
                ...initialAuthState,
                message: 'Logged out successfully',
                messageType: 'info',
            });
            router.replace('/auth/login/') 
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getRole = (user) => {
        if (user?.is_local_guide && user?.guide_approved) return 'guide';
        if (user?.is_staff) return 'admin';
        return 'tourist';
    };

    const authFunctions = useMemo(() => ({
        ...state,
        login,
        register,
        logout,
        refreshUser, // Exposed refresh function
        role: getRole(state.user),
        clearMessage: () => setState(prev => ({ ...prev, message: null, messageType: null })), 
    }), [state]);

    // --- Render loading state while checking tokens/profile
    if (state.isLoading) {
        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={authFunctions}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

const styles = StyleSheet.create({
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#007AFF',
    }
});