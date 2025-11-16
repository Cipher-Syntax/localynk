import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 
// import { useAuth } from "../../../context/AuthContext"; // Ensure correct import path
import { useAuth } from "../../context/AuthContext"

const FeePaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { refreshUser } = useAuth(); // <-- GETTING REFRESH FUNCTION

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const payload = {
                payment_type: 'RegistrationFee',
                final_amount: paymentData.totalPrice, 
                payment_method: paymentData.paymentMethod,
            };

            const initiateResponse = await api.post('/api/initiate/', payload);

            if (initiateResponse.data.checkout_url) {
                const transactionId = initiateResponse.data.transaction_id;
                
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment

                const webhookPayload = {
                    transaction_id: transactionId,
                    status: 'succeeded',
                };

                const webhookResponse = await api.post('/api/webhook/', webhookPayload);

                setIsSuccess(webhookResponse.status === 200);
            } else {
                setIsSuccess(false);
            }
            
            setIsLoading(false);
            setShowConfirmationScreen(true);

        } catch (error) {
            console.error('Payment initiation error:', error.response?.data || error.message);
            setIsLoading(false);
            setIsSuccess(false);
            setShowConfirmationScreen(true); 
        }
    };

    const handleConfirmationDismiss = async () => {
        setShowConfirmationScreen(false);
        setIsModalOpen(false);
        
        if (isSuccess) {
            await refreshUser(); 
            router.replace('/(protected)/home'); 
        } 
    };

    const { baseFee, serviceFee, totalPrice, paymentMethod, firstName, lastName, phoneNumber, country, email } = paymentData || {};

    const confirmationHeader = isSuccess ? "WELCOME ABOARD!" : "PAYMENT FAILED";
    const confirmationIconName = isSuccess ? "checkmark-done-circle" : "close-circle";
    const confirmationIconColor = isSuccess ? '#00A8FF' : '#FF3B30';
    const confirmationTitle = isSuccess ? "Registration Complete!" : "Payment Failed";
    const confirmationMessage = isSuccess
        ? "Congratulations! Your guide account is now active. Welcome to the MFLG community!"
        : "The payment could not be processed. Please check your payment details or try again.";

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
                        {/* Fee Breakdown */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
                            <View style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Base Registration Fee</Text>
                                    <Text style={styles.priceValue}>
                                        ₱ {baseFee ? baseFee.toFixed(2).toLocaleString() : '0.00'}
                                    </Text>
                                </View>

                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>App Service Fee</Text>
                                    <Text style={styles.priceValue}>
                                        ₱ {serviceFee ? serviceFee.toFixed(2).toLocaleString() : '0.00'}
                                    </Text>
                                </View>

                                <View style={styles.priceDivider} />

                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>Total to Pay</Text>
                                    <Text style={styles.totalValue}>
                                        ₱ {totalPrice ? totalPrice.toFixed(2).toLocaleString() : '0.00'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Payment Method */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                            <View style={styles.paymentCard}>
                                <Text style={styles.paymentMethod}>{paymentMethod ? paymentMethod.toUpperCase() : 'N/A'}</Text>
                            </View>
                        </View>

                        {/* Billing Information */}
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

                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirm & Pay Registration Fee</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalOpen(false)}>
                            <Text style={styles.cancelButtonText}>Edit Details</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </ScrollView>

            {/* Final Confirmation Modal */}
            <Modal visible={showConfirmationScreen} animationType="fade" transparent={false}>
                <SafeAreaView style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <Text style={styles.confirmationHeader}>{confirmationHeader}</Text>
                        
                        <Ionicons name={confirmationIconName} size={100} style={[styles.confirmationIcon, { color: confirmationIconColor }]} />
                        
                        <Text style={styles.confirmationTitle}>{confirmationTitle}</Text>
                        
                        <Text style={styles.confirmationMessage}>{confirmationMessage}</Text>

                        <TouchableOpacity style={styles.confirmationButton} onPress={handleConfirmationDismiss}>
                            <Text style={styles.confirmationButtonText}>{isSuccess ? "Get Started" : "OK"}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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

    // Confirmation Modal Styles
    confirmationContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    confirmationContent: { width: '90%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
    confirmationHeader: { fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 40, opacity: 0.8, color: '#00A8FF' },
    confirmationIcon: { marginBottom: 24 },
    confirmationTitle: { fontSize: 26, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    confirmationMessage: { fontSize: 15, color: '#8B98A8', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    confirmationButton: { backgroundColor: '#00A8FF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
    confirmationButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
