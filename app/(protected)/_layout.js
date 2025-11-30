import { Slot, useRouter, usePathname, Stack } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext"; 

export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();
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
    
    const PROFILE_SETUP_PATH = '/onboarding/profile_setup';
    const TERMS_PATH = '/onboarding/terms_and_conditions';
    const HOME_PATH = '/home';
    
    const protectedNonTabPaths = [
        PROFILE_SETUP_PATH,
        TERMS_PATH,
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
        '/completePayment',
        '/completeRegistrationFee',
        '/profile',
        '/profile/edit_profile',
        '/explore',
        '/viewAccommodations',
        '/upgradeMembership',
        '/reviewModal',
        '/myReviews'
    ]; 

    useEffect(() => {
        if (isLoading) return;
        if (navigationAttempted.current) return;

        // --- Auth Check ---
        if (!isAuthenticated) {
            const authPaths = ["/auth/landingPage", "/auth/login", "/auth/register"];
            if (!authPaths.some(p => pathname.startsWith(p))) {
                navigationAttempted.current = true;
                router.replace("/auth/landingPage");
            }
            return;
        }

        // --- Onboarding Flow ---
        // 1. Profile Setup
        if (isProfileIncomplete && pathname !== PROFILE_SETUP_PATH) {
            navigationAttempted.current = true;
            router.replace(PROFILE_SETUP_PATH);
            return;
        }
        
        // 2. Terms and Conditions
        if (!isProfileIncomplete && !hasAcceptedTerms && pathname !== TERMS_PATH) {
            navigationAttempted.current = true;
            router.replace(TERMS_PATH);
            return;
        }

        // --- Final Redirect to Home ---
        // If profile and terms are complete, but user is on an onboarding page, send to home.
        if (!isProfileIncomplete && hasAcceptedTerms) {
            const isInsideOnboarding = pathname.startsWith('/onboarding');
            if (isInsideOnboarding) {
                 navigationAttempted.current = true;
                 router.replace(HOME_PATH);
                 return;
            }
        }
        
    }, [isLoading, isAuthenticated, pathname, isProfileIncomplete, hasAcceptedTerms]);

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
        <View style={{ flex: 1 }}>
            <Slot key={user?.id ?? 'signed-in'} />
        </View>
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
