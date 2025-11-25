import { Slot, useRouter, usePathname, Stack } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext"; 

export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const navigationAttempted = useRef(false);
    
    // Check for missing KYC details: true if user exists and either name field is missing/empty
    const isProfileIncomplete = user && (
        !user.first_name || 
        String(user.first_name).trim() === "" || 
        !user.last_name || 
        String(user.last_name).trim() === ""
    );
    
    const ONBOARDING_PATH = '/onboarding/profile_setup';
    const HOME_PATH = '/home';
    
    // Paths that are NOT tabs but ARE protected screens (like onboarding)
    const protectedNonTabPaths = [
        ONBOARDING_PATH,
        '/touristGuideDetails',
        '/payment',
        '/message',
        '/addTour',
        '/addAccommodation',
        '/UpdateGuideInfoForm',
        '/placesDetails',
        '/guideSelection',
        '/bookingChoice',
        '/guideAvailability',
        '/notification',
        '/agencySelection',
        '/agencyBookingDetails',
        '/termsAndAgreement',
        '/notification',
        '/completePayment',
        '/completeRegistrationFee',
        '/profile',
        '/profile/edit_profile',
        '/explore'
    ]; 

    useEffect(() => {
        // Only run if authentication state is finalized and we haven't already attempted navigation
        if (isLoading) return;

        console.log("Current pathname:", pathname);
        console.log("Find result:", protectedNonTabPaths.find(p => pathname.startsWith(p)));

        // Paths that are explicitly allowed for unauthenticated users
        const authPaths = [
            "/auth/landingPage",
            "/auth/login",
            "/auth/register",
        ];

        // --- 1. UNAUTHENTICATED CHECK ---
        if (!isAuthenticated) {
            if (!authPaths.includes(pathname)) { // <--- MODIFIED CONDITION
                console.log("ProtectedLayout: User not authenticated and not on an auth path, redirecting to landing page");
                router.replace("/auth/landingPage");
            }
            return;
        }

        // --- 2. AUTHENTICATED CHECK (Conditional Routing) ---
        
        // A. If profile is incomplete, force them to the onboarding screen.
        if (isProfileIncomplete && pathname !== ONBOARDING_PATH) {
            console.log("ProtectedLayout: Profile incomplete, forcing redirect to Onboarding.");
            router.replace(ONBOARDING_PATH);
            return;
        }
        
        // B. If profile is complete, ensure they land inside the main tabs route (or a specific child page).
        if (!isProfileIncomplete) {
            const isInsideTabs = pathname.startsWith(HOME_PATH);
            
            if (pathname === ONBOARDING_PATH || (!isInsideTabs && !protectedNonTabPaths.includes(pathname))) {
                console.log("ProtectedLayout: Profile complete, redirecting to Home from " + pathname);
                router.replace(HOME_PATH);
                return;
            }
        }
        
    }, [isLoading, isAuthenticated, pathname, isProfileIncomplete]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // If not authenticated, return null (redirect happens in useEffect)
    if (!isAuthenticated) return null;

    // Render child routes (Slot is correct)
    return <Slot />;
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