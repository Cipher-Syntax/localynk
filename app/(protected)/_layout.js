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
    
    const ONBOARDING_PATH = '/onboarding/profile_setup';
    const HOME_PATH = '/home';
    
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
        '/explore',
        '/viewAccommodations',
        '/upgradeMembership',
        '/reviewModal',
        '/myReviews'
    ]; 

    useEffect(() => {
        if (isLoading) return;

        if (navigationAttempted.current) return;

        console.log("ProtectedLayout: pathname:", pathname, { isAuthenticated, isLoading, user });

        const authPaths = [
            "/auth/landingPage",
            "/auth/login",
            "/auth/register",
        ];

        if (!isAuthenticated) {
            const onAuthPath = authPaths.some(p => pathname.startsWith(p));
            if (!onAuthPath) {
                navigationAttempted.current = true;
                console.log("ProtectedLayout: not auth -> redirect to landing");
                router.replace("/auth/landingPage");
            }
            return;
        }

        if (isProfileIncomplete && pathname !== ONBOARDING_PATH) {
            navigationAttempted.current = true;
            console.log("ProtectedLayout: profile incomplete -> onboarding");
            router.replace(ONBOARDING_PATH);
            return;
        }
        
        if (!isProfileIncomplete) {
            const isInsideTabs = pathname.startsWith(HOME_PATH);
            const isProtectedNonTab = protectedNonTabPaths.some(p => pathname.startsWith(p));

            if (pathname === ONBOARDING_PATH || (!isInsideTabs && !isProtectedNonTab)) {
                navigationAttempted.current = true;
                console.log("ProtectedLayout: redirecting to home from", pathname);
                router.replace(HOME_PATH);
                return;
            }
        }
        
    }, [isLoading, isAuthenticated, pathname, isProfileIncomplete]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!isAuthenticated) return null;

    return <Slot key={user?.id ?? 'signed-in'} />;
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
