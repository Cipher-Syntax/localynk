import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setApiToken, setLogoutInProgress } from '../api/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/constants';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
    configureForegroundNotificationHandler,
    ensureAndroidNotificationChannel,
    requestPushPermissionAsync,
    getPushPermissionStatusAsync,
    getExpoPushTokenAsync,
    persistPushToken,
    getPersistedPushToken,
    clearPersistedPushToken,
    openNotificationSettingsAsync,
    resolveNotificationRoute,
} from '../utils/pushNotifications';

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
    
    const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);
    const router = useRouter();
    const notificationListenerRef = useRef(null);
    const notificationResponseListenerRef = useRef(null);
    const pushRegistrationRef = useRef({
        inFlight: false,
        hasRegistered: false,
        retryCount: 0,
        retryTimer: null,
    });

    const clearPushRetryTimer = useCallback(() => {
        if (pushRegistrationRef.current.retryTimer) {
            clearTimeout(pushRegistrationRef.current.retryTimer);
            pushRegistrationRef.current.retryTimer = null;
        }
    }, []);

    const schedulePushRegistrationRetry = useCallback((retryFn, delayMs) => {
        clearPushRetryTimer();
        pushRegistrationRef.current.retryTimer = setTimeout(() => {
            pushRegistrationRef.current.retryTimer = null;
            retryFn();
        }, delayMs);
    }, [clearPushRetryTimer]);

    useEffect(() => {
        configureForegroundNotificationHandler();
        ensureAndroidNotificationChannel();
        requestPushPermissionAsync().catch(() => null);
    }, []);

    const handleNotificationNavigation = useCallback((response) => {
        const data = response?.notification?.request?.content?.data || {};
        console.log('Notification tap payload:', data);
        const route = resolveNotificationRoute(data);
        console.log('Resolved notification route:', route);
        if (route) {
            router.push(route);
        }
    }, [router]);

    const registerPushTokenWithBackend = useCallback(async () => {
        if (pushRegistrationRef.current.inFlight || pushRegistrationRef.current.hasRegistered) {
            return;
        }

        pushRegistrationRef.current.inFlight = true;

        try {
            const permission = await getPushPermissionStatusAsync();

            if (permission.status === 'denied' && permission.canAskAgain === false) {
                Alert.alert(
                    'Notifications Disabled',
                    'Push notifications are disabled for this app. Enable them in system settings to receive messages and booking updates.',
                    [
                        { text: 'Not now', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => openNotificationSettingsAsync(),
                        },
                    ]
                );
                return;
            }

            const granted = await requestPushPermissionAsync();
            if (!granted) {
                console.log('Push token registration skipped: permission not granted.');
                return;
            }

            const expoPushToken = await getExpoPushTokenAsync();
            if (!expoPushToken) {
                console.log('Push token registration skipped: expo token unavailable.');
                return;
            }

            await persistPushToken(expoPushToken);

            await api.post('/api/push-tokens/register/', {
                expo_push_token: expoPushToken,
                platform: Platform.OS || 'unknown',
                app_version: Constants?.expoConfig?.version || null,
            });

            clearPushRetryTimer();
            pushRegistrationRef.current.retryCount = 0;
            pushRegistrationRef.current.hasRegistered = true;
            console.log('Push token registered successfully.');
        } catch (error) {
            const responseStatus = error?.response?.status;
            const expoError = error?.response?.data?.errors?.[0];
            const expoErrorCode = expoError?.code || error?.response?.data?.code;
            const expoTransient = expoError?.isTransient === true || expoErrorCode === 'SERVICE_UNAVAILABLE';
            const errorText = String(error?.message || '');
            const transientByMessage = /SERVICE_UNAVAILABLE|temporarily unavailable|503/i.test(errorText);
            const isTransient = responseStatus === 503 || expoTransient || transientByMessage;

            if (isTransient) {
                const nextRetry = pushRegistrationRef.current.retryCount + 1;
                pushRegistrationRef.current.retryCount = nextRetry;

                if (nextRetry <= 5) {
                    const delayMs = Math.min(60000, 5000 * (2 ** (nextRetry - 1)));
                    console.log(`Push token registration transient failure (attempt ${nextRetry}/5). Retrying in ${Math.round(delayMs / 1000)}s.`);
                    schedulePushRegistrationRetry(() => {
                        registerPushTokenWithBackend();
                    }, delayMs);
                } else {
                    console.log('Push token registration failed after retries:', error?.response?.data || error?.message || error);
                }
            } else {
                console.log('Push token registration failed:', error?.response?.data || error?.message || error);
            }
        } finally {
            pushRegistrationRef.current.inFlight = false;
        }
    }, [clearPushRetryTimer, schedulePushRegistrationRetry]);

    const unregisterPushTokenFromBackend = useCallback(async () => {
        try {
            const token = await getPersistedPushToken();
            if (!token) return;

            await api.post('/api/push-tokens/unregister/', {
                expo_push_token: token,
            });
        } catch (error) {
            console.log('Push token unregistration failed:', error?.response?.data || error?.message || error);
        } finally {
            await clearPersistedPushToken();
        }
    }, []);

    const clearMessage = useCallback(() => {
        setState(prev => ({ ...prev, message: null, messageType: null }));
    }, []);

    const setMessage = useCallback((msg, type = 'error') => {
        setState(prev => ({ ...prev, message: msg, messageType: type }));
    }, []);

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

    const isPortalOnlyAccount = useCallback((userProfile) => {
        if (!userProfile) return false;
        return Boolean(userProfile.is_superuser || userProfile.is_staff || userProfile.agency_profile);
    }, []);

    const hasPendingGuideApplication = useCallback((userProfile) => {
        if (!userProfile) return false;

        if (typeof userProfile.has_pending_application === 'boolean') {
            return userProfile.has_pending_application;
        }

        const guideApplication = userProfile.guide_application;
        if (!guideApplication) return false;

        if (typeof guideApplication.is_reviewed === 'boolean') {
            return !guideApplication.is_reviewed;
        }

        return true;
    }, []);

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
                    setApiToken(access);
                    
                    const user = await fetchProfile();
                    if (user) {
                        if (isPortalOnlyAccount(user)) {
                            await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
                            setApiToken(null);

                            const portalLabel = user.is_superuser ? 'Admin Portal' : 'Agency Portal';
                            setState({
                                isAuthenticated: false,
                                user: null,
                                token: null,
                                isLoading: false,
                                message: `This account must sign in through the ${portalLabel}.`,
                                messageType: 'error'
                            });
                            return;
                        }

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
    }, [isPortalOnlyAccount]);

    useEffect(() => {
        if (!state.isAuthenticated) return;

        registerPushTokenWithBackend();

        if (!notificationListenerRef.current) {
            notificationListenerRef.current = Notifications.addNotificationReceivedListener(() => {
                // Foreground notifications are shown by notification handler.
            });
        }

        if (!notificationResponseListenerRef.current) {
            notificationResponseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
                handleNotificationNavigation(response);
            });
        }

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) {
                handleNotificationNavigation(response);
            }
        });
    }, [state.isAuthenticated, registerPushTokenWithBackend, handleNotificationNavigation]);

    useEffect(() => {
        if (state.isAuthenticated) return;

        clearPushRetryTimer();
        pushRegistrationRef.current.inFlight = false;
        pushRegistrationRef.current.hasRegistered = false;
        pushRegistrationRef.current.retryCount = 0;
    }, [state.isAuthenticated, clearPushRetryTimer]);

    useEffect(() => {
        return () => {
            clearPushRetryTimer();

            if (notificationListenerRef.current) {
                notificationListenerRef.current.remove();
                notificationListenerRef.current = null;
            }
            if (notificationResponseListenerRef.current) {
                notificationResponseListenerRef.current.remove();
                notificationResponseListenerRef.current = null;
            }
        };
    }, [clearPushRetryTimer]);

    const handleAuthResponse = async (data) => {
        const access = data.access;
        const refresh = data.refresh;

        await AsyncStorage.setItem(ACCESS_TOKEN, access);
        await AsyncStorage.setItem(REFRESH_TOKEN, refresh);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setApiToken(access);

        const user = await fetchProfile();

        if (!user) {
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

        if (isPortalOnlyAccount(user)) {
            await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
            setApiToken(null);

            const portalLabel = user.is_superuser ? 'Admin Portal' : 'Agency Portal';
            setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                message: `This account must sign in through the ${portalLabel}.`,
                messageType: 'error',
            }));
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

    const login = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true, message: null }));

        try {
            const response = await api.post('/api/token/', { username, password });
            return await handleAuthResponse(response.data);
        } 
        catch (error) {
            if (error.response?.data?.code === "account_deactivated") {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    isAuthenticated: false,
                    message: error.response.data.detail,
                    messageType: "error"
                }));
                return { success: false, error: error.response.data };
            }

            let msg = "Invalid username or password";
            let errorDetail = null;

            if (error.message === "No refresh token available") {
                msg = "Invalid username or password";
            }
            else if (error.response?.data?.detail) {
                errorDetail = error.response.data.detail;
            }
            else if (error.detail) {
                errorDetail = error.detail;
            }
            else if (error.response?.data?.message) {
                errorDetail = error.response.data.message;
            }
            
            if (errorDetail && typeof errorDetail === 'string') {
                msg = errorDetail;
            }

            // MODIFIED: Updated error to catch both unverified and deactivated accounts
            if (msg.toLowerCase().includes("no active account")) {
                msg = "Account inactive. Please verify your email or reactivate your account if it was deactivated.";
            }

            setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
                message: msg,
                messageType: "error"
            }));

            return false;
        }
    };

    const googleLogin = async (token) => {
        setState(prev => ({ ...prev, isLoading: true, message: null }));
        try {
            const response = await api.post('/api/auth/google/', { token });
            return await handleAuthResponse(response.data);
        } catch (error) {
            console.log("Google Login Error:", error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
                message: "Google Login failed. Please try again.",
                messageType: "error"
            }));
            return false;
        }
    };

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

    const reactivateAccount = async (username, password) => {
        setState(prev => ({ ...prev, isLoading: true, message: null }));
        try {
            const response = await api.post('/api/auth/reactivate/', { username, password });
            return await handleAuthResponse(response.data);
        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                message: "Reactivation failed. " + (error.response?.data?.detail || ""),
                messageType: "error"
            }));
            return false;
        }
    };

    const logout = async (shouldRedirect = true) => {
        setLogoutInProgress(true);

        try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
        } catch (error) {
            try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
        }

        try {
            // Best-effort call only. Never block logout on token unregistration failures.
            try {
                await unregisterPushTokenFromBackend();
            } catch (e) {
                console.log('Push unregistration skipped during logout:', e?.message || e);
            }

            await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
            setApiToken(null); 
            setHasSkippedOnboarding(false);

            setState({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                message: "Logged out successfully",
                messageType: "success"
            });

            if (shouldRedirect) {
                router.replace("/auth/landingPage");
            }
        } catch (e) {
            console.error("Logout failed", e);
            setState({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
                message: null,
                messageType: null
            });
            setApiToken(null); 
            router.replace("/auth/landingPage");
        } finally {
            setTimeout(() => setLogoutInProgress(false), 0);
        }
    }

    const value = useMemo(() => {
        let role = 'tourist'; 
        
        if (state.user) {
            if (state.user.is_local_guide && state.user.guide_approved) {
                role = 'guide';
            } else if (
                state.user.is_local_guide &&
                !state.user.guide_approved &&
                hasPendingGuideApplication(state.user)
            ) {
                role = 'pending_guide';
            }
        }

        return {
            ...state,
            role,
            hasSkippedOnboarding, 
            setHasSkippedOnboarding,
            login,
            googleLogin, 
            register,
            logout,
            refreshUser,
            updateUserProfile,
            resendVerificationEmail,
            reactivateAccount,
            clearMessage,
            setMessage, 
        }
    }, [state, hasSkippedOnboarding, hasPendingGuideApplication]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

const styles = StyleSheet.create({
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});