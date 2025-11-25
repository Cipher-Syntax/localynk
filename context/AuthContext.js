import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
    messageType: null,
};

export function AuthProvider({ children }) {
    const [state, setState] = useState(initialAuthState);
    const router = useRouter();

    // --- Clear messages (memoized so it NEVER changes)
    const clearMessage = useCallback(() => {
        setState(prev => ({ ...prev, message: null, messageType: null }));
    }, []);

    // --- Fetch Profile
    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/profile/');
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    };

    // --- UPDATE Profile
    const updateUserProfile = async (profileData) => {
        try {
            const response = await api.patch('/api/profile/', profileData);

            setState(prev => ({
                ...prev,
                user: response.data,
                message: "Profile updated successfully.",
                messageType: "success"
            }));

            return true;
        } catch (err) {
            setState(prev => ({
                ...prev,
                message: "Failed to update profile.",
                messageType: "error"
            }));
            return false;
        }
    };

    // --- Refresh User
    const refreshUser = async () => {
        try {
            const user = await fetchProfile();
            if (user) {
                setState(prev => ({ ...prev, user, isAuthenticated: true }));
            }
            return true;
        } catch {
            return false;
        }
    };

    // --- Load tokens on startup
    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                const access = await AsyncStorage.getItem(ACCESS_TOKEN);
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);

                if (access && refresh) {
                    const user = await fetchProfile();
                    if (user) {
                        setState({
                            isAuthenticated: true,
                            user,
                            token: access,
                            isLoading: false,
                            message: null,
                            messageType: null
                        });
                    } else {
                        await AsyncStorage.removeItem(ACCESS_TOKEN);
                        await AsyncStorage.removeItem(REFRESH_TOKEN);
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        loadStoredUser();
    }, []);


    // --- LOGIN
    const login = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const response = await api.post('/api/token/', { username, password });
            const access = response.data.access;
            const refresh = response.data.refresh;

            await AsyncStorage.setItem(ACCESS_TOKEN, access);
            await AsyncStorage.setItem(REFRESH_TOKEN, refresh);

            const user = await fetchProfile();

            if (!user) {
                setState({
                    ...initialAuthState,
                    isLoading: false,
                    message: "Please verify your email first.",
                    messageType: "error",
                });
                return false;
            }

            setState({
                isAuthenticated: true,
                user,
                token: access,
                isLoading: false,
                message: "Login successful!",
                messageType: "success"
            });

            return user; 
        } 
        catch (error) {
            let msg = "Invalid username or password";
            if (error.response?.data?.detail?.includes("verify")) {
                msg = "Please verify your email before logging in.";
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                message: msg,
                messageType: "error"
            }));

            return false;
        }
    };

    // --- REGISTER
    const register = async (data) => {
        try {
            await api.post('/api/register/', data);

            setState(prev => ({
                ...prev,
                message: "Registration successful. Check your email to verify.",
                messageType: "success"
            }));

            return { success: true };
        } 
        catch (error) {
            setState(prev => ({
                ...prev,
                message: "Registration failed.",
                messageType: "error"
            }));
            return false;
        }
    };

    // --- RESEND VERIFICATION
    const resendVerificationEmail = async (email) => {
        try {
            const response = await api.post("/api/resend-verify-email/", { email });

            setState(prev => ({
                ...prev,
                message: response.data.detail,
                messageType: "success"
            }));

        } catch (error) {
            setState(prev => ({
                ...prev,
                message: "Failed to resend email",
                messageType: "error"
            }));
        }
    };

    // --- LOGOUT
    const logout = async () => {
        await AsyncStorage.removeItem(ACCESS_TOKEN);
        await AsyncStorage.removeItem(REFRESH_TOKEN);

        setState({
            ...initialAuthState,
            isLoading: false,
            message: "Logged out",
            messageType: "info"
        });

        router.replace("/auth/landingPage");
    };

    // --- Memoized context values
    const value = useMemo(() => {
        // --- Calculate the role based on the user object ---
        let role = 'tourist'; // Default role
        
        if (state.user) {
            if (state.user.is_local_guide && state.user.guide_approved) {
                role = 'guide';
            } else if (state.user.is_local_guide && !state.user.guide_approved) {
                role = 'pending_guide';
            }
        }

        return {
            ...state,
            role,
            login,
            register,
            logout,
            refreshUser,
            updateUserProfile,
            resendVerificationEmail,
            clearMessage,
        }
    }, [state]);

    if (state.isLoading) {
        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text>Authenticating...</Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={value}>
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
    }
});