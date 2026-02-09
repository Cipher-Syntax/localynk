import { Stack, useRouter, usePathname } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext"; 

export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, user, hasSkippedOnboarding } = useAuth();
    const router = useRouter();
    const pathnameRaw = usePathname();
    const navigationAttempted = useRef(false);
    const pathname = (pathnameRaw || '').split('?')[0].replace(/\/+$/, '') || '/';
    
    const isProfileIncomplete = user && (
        !user.first_name || 
        String(user.first_name).trim() === "" || 
        !user.last_name || 
        String(user.last_name).trim() === ""
    );
    const hasAcceptedTerms = user?.has_accepted_terms;
    
    // Paths
    const PROFILE_SETUP_PATH = '/onboarding/profile_setup';
    const TERMS_PATH = '/onboarding/terms_and_conditions';
    const PERSONALIZATION_PATH = '/onboarding/personalization';
    const HOME_PATH = '/home';

    // Helper to check if onboarding is complete in the user profile
    const isOnboardingComplete = user?.personalization_profile?.onboarding_completed;

    useEffect(() => {
        if (isLoading) return;
        
        // Reset nav ref if path changes significantly or user changes, though usually we want to debounce
        // navigationAttempted.current = false; 

        if (!isAuthenticated) {
            const authPaths = ["/auth/landingPage", "/auth/login", "/auth/register"];
            if (!authPaths.some(p => pathname.startsWith(p))) {
                router.replace("/auth/landingPage");
            }
            return;
        }

        // 1. Profile Setup Check
        if (isProfileIncomplete && pathname !== PROFILE_SETUP_PATH) {
            router.replace(PROFILE_SETUP_PATH);
            return;
        }
        
        // 2. Terms Check
        if (!isProfileIncomplete && !hasAcceptedTerms && pathname !== TERMS_PATH) {
            router.replace(TERMS_PATH);
            return;
        }

        // 3. Personalization Check (The new logic)
        // Only run if profile & terms are done
        if (!isProfileIncomplete && hasAcceptedTerms) {
            
            // If user hasn't completed onboarding AND hasn't skipped it this session
            if (!isOnboardingComplete && !hasSkippedOnboarding && pathname !== PERSONALIZATION_PATH) {
                router.replace(PERSONALIZATION_PATH);
                return;
            }

            // If everything is done or skipped, but we are still in an onboarding screen, go home
            // (Unless it's the personalization screen in edit mode, but edit mode usually comes from inside home)
            const isInsideOnboarding = pathname.startsWith('/onboarding');
            if (isInsideOnboarding) {
                 // Special check: allow staying on personalization if we are actively interacting with it (path check handled above)
                 // If we are here, it means we ARE inside onboarding, but requirements met.
                 // However, if we are on Personalization page and just finished, handled by button.
                 // If we are on Profile Setup or Terms and just finished, go home.
                 if (pathname !== PERSONALIZATION_PATH) {
                     router.replace(HOME_PATH);
                 }
                 // If pathname IS personalization, let the component handle the navigation (Skip/Continue buttons)
                 // to avoid infinite loops or forcing user out while they decide.
            }
        }
        
    }, [isLoading, isAuthenticated, pathname, isProfileIncomplete, hasAcceptedTerms, isOnboardingComplete, hasSkippedOnboarding]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="home" />
            <Stack.Screen name="onboarding/personalization" />
        </Stack>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: '#f0f0f0' 
    },
    loadingText: {
        fontSize: 16, 
        marginTop: 10
    }
});