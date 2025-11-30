import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext";

const FeePaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const router = useRouter();
    const { refreshUser } = useAuth();
    const pollingRef = useRef(null);

    const handleInitiatePayment = async () => {
        setIsLoading(true);
        try {
            const payload = {
                payment_type: 'RegistrationFee',
                final_amount: paymentData.totalPrice,
                payment_method: paymentData.paymentMethod,
            };

            const response = await api.post('/api/payments/initiate/', payload);
            
            const responseData = response.data;
            
            console.log("LOG Full Response Data:", responseData);
            console.log("LOG Checkout url:", responseData.checkout_url);

            if (responseData.checkout_url) {
                setCheckoutUrl(responseData.checkout_url);
                setPaymentId(responseData.payment_id);
                setShowPaymentLink(true);

                startPolling(responseData.payment_id);
            } else {
                console.log("LOG Response data missing checkout URL:", responseData);
                Alert.alert("Payment Error", "Could not retrieve payment link. The link was missing from the server response.");
            }
        } catch (error) {
            const status = error.response?.status;
            let errorMessage = "Failed to initiate payment. Check your internet or try again.";

            if (status === 401) {
                errorMessage = "Authentication Failed. Please log in again to process payment.";
            } else if (status === 400 && error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }

            console.error("Payment initiation failed:", error.response?.data || error.message);
            Alert.alert("Payment Error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const startPolling = (id) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data.status;

                setPaymentStatus(status);

                if (status === "succeeded" || status === "failed") {
                    clearInterval(pollingRef.current);
                    refreshUser();
                    Alert.alert(
                        status === "succeeded" ? "Payment Successful" : "Payment Failed",
                        status === "succeeded"
                            ? "Your registration fee payment has been confirmed!"
                            : "Payment failed. Please try again."
                    );
                    setIsModalOpen(false);
                    router.replace('/home');
                }
            } catch (err) {
                console.error("Polling payment status failed:", err);
            }
        }, 3000);
    };

    const handleExternalPayment = async () => {
        if (!checkoutUrl) return;

        try {
            await Linking.openURL(checkoutUrl);
            Alert.alert(
                "Redirected to Payment",
                "You are being redirected to PayMongo. Payment status will update automatically."
            );
        } catch (error) {
            console.error("Failed to open checkout:", error);
            Alert.alert("Error", "Could not open payment link.");
        }
    };

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const { baseFee, serviceFee, totalPrice, paymentMethod, firstName, lastName, phoneNumber, country, email } = paymentData || {};

    return (
        <Modal visible={isModalOpen} animationType="slide">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                            <Ionicons name="close" size={28} color="#1A2332" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>REGISTRATION FEE REVIEW</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
                            <View style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Base Registration Fee</Text>
                                    <Text style={styles.priceValue}>₱ {baseFee?.toFixed(2).toLocaleString() || '0.00'}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>App Service Fee</Text>
                                    <Text style={styles.priceValue}>₱ {serviceFee?.toFixed(2).toLocaleString() || '0.00'}</Text>
                                </View>
                                <View style={styles.priceDivider} />
                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>Total to Pay</Text>
                                    <Text style={styles.totalValue}>₱ {totalPrice?.toFixed(2).toLocaleString() || '0.00'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                            <View style={styles.paymentCard}>
                                <Text style={styles.paymentMethod}>{paymentMethod?.toUpperCase() || 'N/A'}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Billing Information</Text>
                            <View style={styles.billingCard}>
                                <View style={styles.billingRow}>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>First Name</Text>
                                        <Text style={styles.billingValue}>{firstName}</Text>
                                    </View>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Last Name</Text>
                                        <Text style={styles.billingValue}>{lastName}</Text>
                                    </View>
                                </View>
                                <View style={styles.billingRow}>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Phone Number</Text>
                                        <Text style={styles.billingValue}>{phoneNumber}</Text>
                                    </View>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Country</Text>
                                        <Text style={styles.billingValue}>{country}</Text>
                                    </View>
                                </View>
                                <View style={styles.billingFullRow}>
                                    <Text style={styles.billingLabel}>Email</Text>
                                    <Text style={styles.billingValue}>{email}</Text>
                                </View>
                            </View>
                        </View>

                        {!showPaymentLink ? (
                            <TouchableOpacity style={styles.confirmButton} onPress={handleInitiatePayment} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Initiate Payment Link</Text>}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.confirmButton} onPress={handleExternalPayment}>
                                <Text style={styles.confirmButtonText}>Go to PayMongo Checkout</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalOpen(false)}>
                            <Text style={styles.cancelButtonText}>Edit Details</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </ScrollView>
        </Modal>
    );
};

export default FeePaymentReviewModal;


const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    contentContainer: { padding: 16, paddingBottom: 30 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A2332', marginBottom: 12 },
    
    priceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 12, color: '#1A2332', fontWeight: '500' },
    priceValue: { fontSize: 12, color: '#1A2332', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#E0E6ED', marginVertical: 10 },
    totalLabel: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    totalValue: { fontSize: 13, fontWeight: '700', color: '#00A8FF' },
    
    paymentCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0E6ED', alignItems: 'center' },
    paymentMethod: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    
    billingCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0E6ED' },
    billingRow: { flexDirection: 'row', marginBottom: 12 },
    billingFullRow: { paddingVertical: 8 },
    billingItem: { flex: 1, marginRight: 12 },
    billingLabel: { fontSize: 10, color: '#8B98A8', fontWeight: '600' },
    billingValue: { fontSize: 12, fontWeight: '600', color: '#1A2332', marginTop: 3 },
    
    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cancelButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#00A8FF' },
    cancelButtonText: { color: '#00A8FF', fontWeight: '700', fontSize: 14 },

    confirmationContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    confirmationContent: { width: '90%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
    confirmationHeader: { fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 40, opacity: 0.8, color: '#00A8FF' },
    confirmationIcon: { marginBottom: 24 },
    confirmationTitle: { fontSize: 26, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    confirmationMessage: { fontSize: 15, color: '#8B98A8', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    confirmationButton: { backgroundColor: '#00A8FF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
    confirmationButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});