import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
// Assuming IsTourist is the Guide Dashboard and Action is the Tourist/Initial screen
import { IsTourist, Action, PendingGuide } from "../../../components/tourist_guide"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext"; 

export default function TourGuide() {
    const [loading, setLoading] = useState(true);
    const { role, isLoading: isAuthLoading } = useAuth(); // Now correctly receives 'guide', 'pending_guide', or 'tourist'

    useEffect(() => {
        // Wait a short time before marking the screen as loaded
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Combine local loading state (for screen transition) with Auth loading state (for fetching user profile)
    if (loading || isAuthLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // --- CONDITIONAL RENDERING ---

    // 1. Fully Approved Guide
    if (role === 'guide') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Renders the Guide Dashboard */}
                    <IsTourist /> 
                </ScrollView>
            </SafeAreaView>
        );
    }
    
    // 2. Pending Guide Review
    if (role === 'pending_guide') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Renders the Pending Guide page */}
                    <PendingGuide /> 
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 3. Tourist (Default) or other non-guide roles
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Action />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    safeArea: {
        flex: 1
    },
    scrollContent: { 
        flexGrow: 1 
    }
});