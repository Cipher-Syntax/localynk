import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, Alert } from "react-native";
// Assuming IsTourist is the Guide Dashboard and Action is the Tourist/Initial screen
import { IsTourist, Action, PendingGuide } from "../../../components/tourist_guide"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from 'expo-router';

export default function TourGuide() {
    const [loading, setLoading] = useState(true);
    const { role, isLoading: isAuthLoading, refreshUser, user } = useAuth();
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const router = useRouter();

    const prevRoleRef = useRef();

    const handleDebugRefresh = async () => {
        console.log("Refreshing user data...");
        const success = await refreshUser();
        if (success) {
            console.log("USER DATA AFTER REFRESH:", JSON.stringify(user, null, 2));
            Alert.alert("User Data Logged", "Check the console for the latest user data from the backend.");
        } else {
            Alert.alert("Refresh Failed", "Could not fetch user data from the backend.");
        }
    };

    useEffect(() => {
        if (prevRoleRef.current === 'pending_guide' && role === 'guide') {
            setShowWelcomeModal(true);
        }
        prevRoleRef.current = role;
    }, [role]);

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

    const handleSubscription = () => {
        setShowWelcomeModal(false);
        router.push('/(protected)/upgrade');
    };
    
    // --- CONDITIONAL RENDERING ---

    // 1. Fully Approved Guide
    if (role === 'guide') {
        return (
            <View style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Renders the Guide Dashboard */}
                    <IsTourist /> 
                </ScrollView>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showWelcomeModal}
                    onRequestClose={() => {
                        setShowWelcomeModal(!showWelcomeModal);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Welcome, Local Guide!</Text>
                            <Text style={styles.modalText}>Your application has been approved. You are now on the Free Tier.</Text>
                            <Text style={styles.modalSubText}>Free Tier Limitations:</Text>
                            <Text style={styles.modalListItem}>- You can accept only one booking.</Text>
                            <Text style={styles.modalText}>Upgrade to our Paid Tier to enjoy unlimited bookings and premium features.</Text>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSubscribe]}
                                onPress={handleSubscription}
                            >
                                <Text style={styles.textStyle}>Subscribe Now (₱3000/year)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setShowWelcomeModal(false)}
                            >
                                <Text style={styles.textStyle}>Maybe Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
    
    // 2. Pending Guide Review
    if (role === 'pending_guide') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Renders the Pending Guide page */}
                    <PendingGuide /> 
                    <TouchableOpacity onPress={handleDebugRefresh} style={styles.debugButton}>
                        <Text style={styles.debugButtonText}>Refresh and Log User</Text>
                    </TouchableOpacity>
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
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    modalSubText: {
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    modalListItem: {
        alignSelf: 'flex-start',
        marginBottom: 15,
        marginLeft: 10,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 10,
        width: 200,
    },
    buttonSubscribe: {
        backgroundColor: "#2196F3",
    },
    buttonClose: {
        backgroundColor: "#f44336",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    debugButton: {
        backgroundColor: 'purple',
        padding: 15,
        margin: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    debugButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});