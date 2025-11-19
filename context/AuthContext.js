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
    messageType: null, // 'success', 'error', 'info'
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialAuthState);
    const router = useRouter();

    // --- Core function to fetch profile ---
    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/profile/');
            return response.data;
        } catch (error) {
            if (
                error.response?.status === 404 ||
                error.response?.data?.code === 'user_not_found'
            ) {
                return null;
            }
            throw error;
        }
    };

    // ⭐ NEW FUNCTION: Handle PATCH request to update user profile
    const updateUserProfile = async (profileData) => {
        try {
            const response = await api.patch('/api/profile/', profileData);
            const updatedUser = response.data;

            setState(prev => ({
                ...prev,
                user: updatedUser,
                message: 'Profile updated successfully.',
                messageType: 'success'
            }));

            // In a production app, you might want to re-save updated user data 
            // to AsyncStorage if you store the entire user object there.

            return true; // Success
        } catch (error) {
            console.error("Profile update failed:", error.response?.data || error);
            // Return specific error message from backend if available
            let errorMessage = 'Failed to update profile. Please check your inputs.';
            if (error.response?.data) {
                // Simplified error extraction, adjust based on your Django API format
                errorMessage = JSON.stringify(error.response.data);
            }
            setState(prev => ({
                ...prev,
                message: errorMessage,
                messageType: 'error'
            }));
            return false; // Failure
        }
    };


    // --- Refresh user manually ---
    const refreshUser = async () => {
        try {
            const user = await fetchProfile();
            if (user) {
                setState(prev => ({ 
                    ...prev, 
                    user, 
                    isAuthenticated: true, 
                    message: 'Profile refreshed.',
                    messageType: 'info'
                }));
            }
            return true;
        } catch (e) {
            console.error('Failed to refresh user profile:', e);
            return false;
        }
    };

    // --- Load stored tokens on app startup ---
    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                const access = await AsyncStorage.getItem(ACCESS_TOKEN);
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);

                console.log('Checking stored tokens...', { access: !!access, refresh: !!refresh });

                if (access && refresh) {
                    try {
                        const user = await fetchProfile();
                        if (user) {
                            console.log('User loaded from stored tokens:', user);
                            setState({ 
                                isAuthenticated: true, 
                                user, 
                                token: access, 
                                isLoading: false,
                                message: null,
                                messageType: null
                            });
                        } else {
                            // tokens exist but user is inactive/unverified
                            console.log('Tokens exist but user not found or inactive');
                            await AsyncStorage.removeItem(ACCESS_TOKEN);
                            await AsyncStorage.removeItem(REFRESH_TOKEN);
                            setState(prev => ({ ...prev, isLoading: false }));
                        }
                    } catch (profileError) {
                        console.error('Error fetching profile:', profileError);
                        await AsyncStorage.removeItem(ACCESS_TOKEN);
                        await AsyncStorage.removeItem(REFRESH_TOKEN);
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    console.log('No stored tokens found');
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Error loading tokens:', error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };
        loadStoredUser();
    }, []);

    // --- LOGIN ---
    const login = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await api.post('/api/token/', { username, password });
            const access = response.data.access;
            const refresh = response.data.refresh;

            await AsyncStorage.setItem(ACCESS_TOKEN, access);
            await AsyncStorage.setItem(REFRESH_TOKEN, refresh);

            // Fetch profile
            const user = await fetchProfile();

            if (!user) {
                setState({
                    ...initialAuthState,
                    isLoading: false,
                    message: 'Account not verified. Check your email.',
                    messageType: 'error',
                });
                return false;
            }

            setState({
                isAuthenticated: true,
                user, // Return user object for first-time check in AuthForm
                token: access,
                isLoading: false,
                message: 'Login successful!',
                messageType: 'success',
            });
            return user; // ⭐ IMPORTANT: Return the user object on success
        }
        catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            
            let errorMessage = 'Invalid username or password';
            
            if (error.response?.data?.detail?.includes('not active') || 
                error.response?.data?.detail?.includes('verify your email')) {
                errorMessage = 'Please verify your email before logging in. Check your inbox.';
            }
            
            setState(prev => ({
                ...prev,
                isLoading: false,
                message: errorMessage,
                messageType: 'error',
            }));
            return false;
        }
    };

    // --- REGISTER ---
    const register = async (userData) => {
        try {
            await api.post('/api/register/', userData);
            setState(prev => ({
                ...prev,
                message: 'Registration successful. Verify your email to log in.',
                messageType: 'success',
            }));
            return { success: true, message: 'Verify your email before logging in.' };
        } catch (error) {
            console.error(
                'Registration error:',
                error?.response?.data ?? error?.message ?? error
            );

            let msg = 'Registration failed. Please check your info.';
            if (error?.response?.data?.detail) {
                msg = error.response.data.detail;
            }

            setState(prev => ({
                ...prev,
                message: msg,
                messageType: 'error',
            }));
            return { success: false, message: msg };
        }
    };


    // --- LOGOUT ---
    const logout = async () => {
        try {
            await AsyncStorage.removeItem(ACCESS_TOKEN);
            await AsyncStorage.removeItem(REFRESH_TOKEN);
            setState({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                message: 'Logged out successfully',
                messageType: 'info',
            });
            router.replace('/auth/landingPage');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // --- ROLE DETECTION ---
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
        refreshUser,
        updateUserProfile, // ⭐ EXPOSED FUNCTION
        role: getRole(state.user),
        clearMessage: () => setState(prev => ({ ...prev, message: null, messageType: null })),
    }), [state]);

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