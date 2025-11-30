import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';
import { useRouter } from 'expo-router';
import { setApiToken } from '../api/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [state, setState] = useState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: true,
        message: null,
        messageType: null,
    });
    
    const router = useRouter();

    // --- Clear messages
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
            if (error.response?.status === 401) return null;
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

    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                const access = await AsyncStorage.getItem(ACCESS_TOKEN);
                const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);

                if (access && refresh) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                    
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
                        await logout(false);
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


    const login = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true, message: null }));

        try {
            const response = await api.post('/api/token/', { username, password });
            const access = response.data.access;
            const refresh = response.data.refresh;

            await AsyncStorage.setItem(ACCESS_TOKEN, access);
            await AsyncStorage.setItem(REFRESH_TOKEN, refresh);
            
            // 2. FORCE Set API Header immediately (Critical for immediate requests)
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

            // 3. Fetch User
            const user = await fetchProfile();

            if (!user) {
                // If we have a token but can't get profile, something is wrong.
                 await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
                 setState(prev => ({
                    ...prev,
                    isLoading: false,
                    isAuthenticated: false,
                    user: null,
                    message: "Please verify your email first.",
                    messageType: "error",
                }));
                return false;
            }

            // 4. Update State
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
            // --- DEBUG LOGS ---
            console.log("LOGIN ERROR DATA:", error.response?.data); 
            console.log("LOGIN ERROR STATUS:", error.response?.status);

            let msg = "Invalid username or password";
            const errorDetail = error.response?.data?.detail;

            // Check specifically for common "inactive" or "verify" messages
            if (errorDetail && (
                (typeof errorDetail === 'string' && errorDetail.toLowerCase().includes("verify")) || 
                (typeof errorDetail === 'string' && errorDetail.toLowerCase().includes("active"))
            )) {
                msg = "Please verify your email before logging in.";
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false, // Ensure this is false on error
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
            console.log("REGISTER ERROR:", error.response?.data);
            
            // Improved error handling
            let errorMsg = "Registration failed.";
            if (error.response?.data) {
                const data = error.response.data;
                if (data.username) errorMsg = Array.isArray(data.username) ? data.username[0] : data.username;
                else if (data.email) errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
                else if (data.password) errorMsg = Array.isArray(data.password) ? data.password[0] : data.password;
                else if (data.detail) errorMsg = data.detail;
            }

            setState(prev => ({
                ...prev,
                message: errorMsg,
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
    const logout = async (shouldRedirect = true) => {
        try {
            await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
            
            setApiToken(null); 

            // (The 'delete api.defaults...' line you had is redundant if you use setApiToken(null), 
            // but keeping it doesn't hurt. setApiToken does the real cleanup.)

            // 3. Reset State
            setState({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                message: "Logged out successfully",
                messageType: "success"
            });

            if (shouldRedirect) {
                router.replace("/auth/login");
            }

        } catch (e) {
            console.error("Logout failed", e);
            // Force reset anyway
            setApiToken(null); // Ensure cache is cleared even on error
            setState({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                message: "Logged out",
                messageType: "info"
            });
            router.replace("/auth/login");
        }
    }

    // --- Memoized context values
    const value = useMemo(() => {
        let role = 'tourist'; 
        
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
                <Text style={{ marginTop: 10 }}>Loading...</Text>
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