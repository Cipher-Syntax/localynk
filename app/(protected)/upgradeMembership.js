import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const UpgradeMembership = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const pollingRef = useRef(null);
    const router = useRouter();
    const { refreshUser } = useAuth();

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const startPolling = (id) => {
        if (!id) return;
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data.status;
                if (status === "succeeded") {
                    clearInterval(pollingRef.current);
                    await refreshUser();
                    setShowConfirmation(true);
                    setIsLoading(false);
                } else if (status === "failed") {
                    clearInterval(pollingRef.current);
                    Alert.alert("Payment Failed", "The payment process failed. Please try again.");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Polling payment status failed:", err);
                // Don't show alert on polling error, just keep trying
            }
        }, 3000);
    };

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/payments/initiate/', {
                payment_type: 'YearlySubscription',
                payment_method: 'GCash',
            });
            const { checkout_url, payment_id } = response.data;
            if (checkout_url && payment_id) {
                setPaymentId(payment_id);
                await Linking.openURL(checkout_url);
                startPolling(payment_id);
            } else {
                Alert.alert('Error', 'Could not initiate payment. Please try again.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            Alert.alert('Error', 'An error occurred while trying to upgrade. Please try again.');
            setIsLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmation(false);
        router.replace('/(protected)/home/tourGuide');
    };

    if (showConfirmation) {
        return (
            <SafeAreaView style={styles.confirmationContainer}>
                <View style={styles.confirmationContent}>
                    <Ionicons name="checkmark-circle" size={100} style={{ color: "#00A8FF", marginBottom: 20 }} />
                    <Text style={styles.confirmationTitle}>Subscription Activated!</Text>
                    <Text style={styles.confirmationMessage}>
                        You are now a Paid Member. You can now accept unlimited bookings.
                    </Text>
                    <TouchableOpacity style={styles.confirmationButton} onPress={handleConfirmationDismiss}>
                        <Text style={styles.confirmationButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Upgrade to Paid</Text>
                <Text style={styles.description}>
                    Become a Paid Member to enjoy unlimited bookings and other premium features.
                </Text>
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleUpgrade}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <ActivityIndicator color="#fff" style={{ marginRight: 10 }}/>
                            <Text style={styles.buttonText}>Waiting for Payment...</Text>
                        </>
                    ) : (
                        <Text style={styles.buttonText}>Pay Yearly Subscription (₱3000.00)</Text>
                    )}
                </TouchableOpacity>
                 {isLoading && <Text style={styles.waitingText}>After paying, return to this screen to confirm.</Text>}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F4F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A9A9A9',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    waitingText: {
        marginTop: 15,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    // Confirmation Screen Styles
    confirmationContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 30,
        backgroundColor: '#F2F4F7',
    },
    confirmationContent: { alignItems: "center" },
    confirmationTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10, textAlign: 'center' },
    confirmationMessage: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginBottom: 20
    },
    confirmationButton: {
        backgroundColor: "#00A8FF",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 12
    },
    confirmationButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 }
});

export default UpgradeMembership;
