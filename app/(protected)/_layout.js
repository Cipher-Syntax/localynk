import { Stack, useRouter, useSegments } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect } from 'react';
import { useAuth } from "../../context/AuthContext"; 

export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, user, hasSkippedOnboarding } = useAuth();
    const router = useRouter();
    // useSegments gives us an array of the path, e.g., ['(protected)', 'home']
    const segments = useSegments(); 

    // Helper to see if the user is currently inside the (protected) group
    const inProtectedGroup = segments[0] === '(protected)';
    
    const isProfileIncomplete = user && (
        !user.first_name || 
        String(user.first_name).trim() === "" || 
        !user.last_name || 
        String(user.last_name).trim() === ""
    );
    const hasAcceptedTerms = user?.has_accepted_terms;

    // Helper to check if onboarding is complete in the user profile
    const isOnboardingComplete = user?.personalization_profile?.onboarding_completed;

    useEffect(() => {
        if (isLoading) return;

        // FIXED: Only kick the user to the landing page if they are actively trying to 
        // access a screen INSIDE the (protected) folder while NOT authenticated.
        if (!isAuthenticated) {
            if (inProtectedGroup) {
                router.replace("/auth/landingPage");
            }
            return;
        }

        // Only run onboarding/profile checks if the user IS authenticated
        if (isAuthenticated) {
            const currentPath = segments.join('/');

            // 1. Profile Setup Check
            if (isProfileIncomplete && currentPath !== '(protected)/onboarding/profile_setup') {
                router.replace('/(protected)/onboarding/profile_setup');
                return;
            }
            
            // 2. Terms Check
            if (!isProfileIncomplete && !hasAcceptedTerms && currentPath !== '(protected)/onboarding/terms_and_conditions') {
                router.replace('/(protected)/onboarding/terms_and_conditions');
                return;
            }

            // 3. Personalization Check 
            if (!isProfileIncomplete && hasAcceptedTerms) {
                // If user hasn't completed onboarding AND hasn't skipped it this session
                if (!isOnboardingComplete && !hasSkippedOnboarding && currentPath !== '(protected)/onboarding/personalization') {
                    router.replace('/(protected)/onboarding/personalization');
                    return;
                }

                // If everything is done or skipped, but we are still in an onboarding screen, go home
                const isInsideOnboarding = currentPath.includes('onboarding');
                if (isInsideOnboarding && currentPath !== '(protected)/onboarding/personalization') {
                    router.replace('/(protected)/home');
                }
            }
        }
        
    }, [isLoading, isAuthenticated, segments, isProfileIncomplete, hasAcceptedTerms, isOnboardingComplete, hasSkippedOnboarding]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Don't render the protected stack at all if not authenticated
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