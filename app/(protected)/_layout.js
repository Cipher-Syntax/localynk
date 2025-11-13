import { Stack, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect } from 'react';
import { useAuth } from "../../context/AuthContext"; 

export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, role } = useAuth();
    const router = useRouter();

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            console.log("ProtectedLayout: Redirecting to login.");
            router.replace("/auth/login");
        }
    }, [isAuthenticated, isLoading, router]);

    // Show a loading screen while checking authentication
    if (isLoading || isAuthenticated === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
        );
    }

    // If not authenticated, the redirect effect already triggers
    if (!isAuthenticated) return null;

    // If authenticated, render the protected stack
    console.log(`User authenticated. Role: ${role}`);
    return <Stack screenOptions={{ headerShown: false }} />;
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
