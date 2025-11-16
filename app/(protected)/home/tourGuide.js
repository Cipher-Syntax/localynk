import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { IsTourist, Action } from "../../../components/tourist_guide";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext"; // <-- CORRECTED IMPORT

export default function TourGuide() {
    // The previous local loading state is largely redundant now but kept for initial screen fade.
    const [loading, setLoading] = useState(true);
    const { role, isLoading: isAuthLoading } = useAuth(); // <-- Get role and Auth loading state

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

    // If role is 'guide' (meaning is_local_guide=True AND guide_approved=True)
    if (role === 'guide') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Render the Guide Dashboard */}
                    <IsTourist /> 
                </ScrollView>
            </SafeAreaView>
        );
    }
    
    // Otherwise, render the application initiation page (Tourist, or Pending Review/Payment)
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