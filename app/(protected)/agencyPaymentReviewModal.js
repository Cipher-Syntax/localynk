import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 
// import { useAuth } from "../../context/AuthContext"; // Import if needed for user context

const AgencyPaymentReviewModal = () => {
    const router = useRouter();
    const params = useLocalSearchParams(); 
    
    // Destructure confirmed booking details passed from the notification
    const { bookingId, totalPrice: confirmedPrice, guideName } = params; 

    // --- State and Interactive Data ---
    const [paymentData, setPaymentData] = useState({
        paymentMethod: 'Gcash', 
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '09123456789',
        country: 'Philippines',
        email: 'john.doe@example.com',
    });

    const [isModalOpen, setIsModalOpen] = useState(true); 
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);

    // Data calculation (using confirmedPrice from the notification)
    const priceFloat = parseFloat(confirmedPrice || '0');
    const baseTourPrice = priceFloat * 0.95; 
    const serviceFee = priceFloat * 0.05; 
    const totalPrice = priceFloat;

    const handleInputChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
    };


    const handleConfirm = async () => {
        setIsLoading(true);
        if (!bookingId) {
            Alert.alert("Error", "Booking ID is missing. Cannot proceed with payment.");
            setIsLoading(false);
            return;
        }

        // --- STATIC SIMULATION FOR UI TESTING ---
        try {
            // Simulate a network delay
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            
            // Validate user input (Simple check before proceeding)
            if (!paymentData.email || !paymentData.firstName) {
                Alert.alert("Validation Error", "Please ensure all required fields are filled out.");
                setIsLoading(false);
                return;
            }
            
            // **Always simulate success for static testing**
            setIsSuccess(true);
            
            setIsLoading(false);
            setShowConfirmationScreen(true);

        } catch (error) {
            console.error('Static simulation error:', error.message);
            setIsLoading(false);
            setIsSuccess(false);
            setShowConfirmationScreen(true); 
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmationScreen(false);
        setIsModalOpen(false);
        
        router.replace(isSuccess ? '/(protected)/home' : '/(protected)/notifications');
    };

    // --- Confirmation Modal Content Setup ---
    const confirmationHeader = isSuccess ? "BOOKING CONFIRMED!" : "PAYMENT FAILED";
    const confirmationIconName = isSuccess ? "checkmark-done-circle" : "close-circle";
    const confirmationIconColor = isSuccess ? '#28A745' : '#FF3B30';
    const confirmationTitle = isSuccess ? "Tour Confirmed!" : "Payment Failed";
    const confirmationMessage = isSuccess
        ? `Your booking (ID: ${bookingId}) with the agency is now complete! Your guide, **${guideName}**, will be ready for your tour. Enjoy your trip!`
        : "The payment could not be processed. Please check your payment details or try again.";

    // Render logic for the main review content
    const renderPaymentContent = () => (
        <View style={styles.contentContainer}>
            
            {/* Booking Details (Display Only) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Booking Details</Text>
                <View style={styles.card}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Booking ID</Text>
                        <Text style={styles.priceValue}>{bookingId}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Assigned Guide</Text>
                        <Text style={styles.priceValue}>{guideName || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Status</Text>
                        <Text style={[styles.totalValue, { color: '#28A745' }]}>Awaiting Payment</Text>
                    </View>
                </View>
            </View>

            {/* Fee Breakdown (Display Only) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Breakdown</Text>
                <View style={styles.card}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Tour Fee</Text>
                        <Text style={styles.priceValue}>
                            ₱ {baseTourPrice.toFixed(2).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Agency/Service Fee</Text>
                        <Text style={styles.priceValue}>
                            ₱ {serviceFee.toFixed(2).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.priceDivider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Payment Due</Text>
                        <Text style={styles.totalValue}>
                            ₱ {totalPrice.toFixed(2).toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Payment Method Selection (Needs to be interactive if multiple options exist) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.paymentCard}>
                    <Text style={styles.paymentMethod}>{paymentData.paymentMethod.toUpperCase()}</Text>
                </View>
            </View>

            {/* Billing Information (Now Interactive) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Billing and Contact Information</Text>
                <View style={styles.billingCard}>
                    
                    {/* First Name & Last Name */}
                    <View style={styles.billingRow}>
                        <View style={styles.billingItem}>
                            <Text style={styles.billingLabel}>First Name*</Text>
                            <TextInput
                                style={styles.billingInput}
                                value={paymentData.firstName}
                                onChangeText={(text) => handleInputChange('firstName', text)}
                            />
                        </View>
                        <View style={styles.billingItem}>
                            <Text style={styles.billingLabel}>Last Name*</Text>
                            <TextInput
                                style={styles.billingInput}
                                value={paymentData.lastName}
                                onChangeText={(text) => handleInputChange('lastName', text)}
                            />
                        </View>
                    </View>
                    
                    {/* Email */}
                    <View style={styles.billingFullRow}>
                        <Text style={styles.billingLabel}>Email*</Text>
                        <TextInput
                            style={styles.billingInput}
                            value={paymentData.email}
                            onChangeText={(text) => handleInputChange('email', text)}
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.billingFullRow}>
                        <Text style={styles.billingLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.billingInput}
                            value={paymentData.phoneNumber}
                            onChangeText={(text) => handleInputChange('phoneNumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Country */}
                    <View style={styles.billingFullRow}>
                        <Text style={styles.billingLabel}>Country</Text>
                        <TextInput
                            style={styles.billingInput}
                            value={paymentData.country}
                            onChangeText={(text) => handleInputChange('country', text)}
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.confirmButtonText}>Confirm & Complete Payment</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Go Back / Edit Details</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => router.back()}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color="#1A2332" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>AGENCY BOOKING PAYMENT</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {renderPaymentContent()}
                </SafeAreaView>
            </ScrollView>

            {/* Final Confirmation Modal */}
            <Modal visible={showConfirmationScreen} animationType="fade" transparent={false}>
                <SafeAreaView style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <Text style={[styles.confirmationHeader, { color: confirmationIconColor }]}>{confirmationHeader}</Text>
                        
                        <Ionicons name={confirmationIconName} size={100} style={[styles.confirmationIcon, { color: confirmationIconColor }]} />
                        
                        <Text style={styles.confirmationTitle}>{confirmationTitle}</Text>
                        
                        <Text style={styles.confirmationMessage}>{confirmationMessage}</Text>

                        <TouchableOpacity style={[styles.confirmationButton, { backgroundColor: confirmationIconColor }]} onPress={handleConfirmationDismiss}>
                            <Text style={styles.confirmationButtonText}>{isSuccess ? "View My Bookings" : "Try Again"}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </Modal>
    );
};

export default AgencyPaymentReviewModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    contentContainer: { padding: 16, paddingBottom: 30 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A2332', marginBottom: 12 },
    
    // Cards & Price Rows (Used for display)
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 12, color: '#1A2332', fontWeight: '500' },
    priceValue: { fontSize: 12, color: '#1A2332', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#E0E6ED', marginVertical: 10 },
    totalLabel: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    totalValue: { fontSize: 13, fontWeight: '700', color: '#28A745' }, 
    
    paymentCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0E6ED', alignItems: 'center' },
    paymentMethod: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    
    // Billing Input Styles
    billingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0E6ED' },
    billingRow: { flexDirection: 'row', marginBottom: 5 },
    billingFullRow: { paddingVertical: 8, marginBottom: 5 },
    billingItem: { flex: 1, marginRight: 12 },
    billingLabel: { fontSize: 12, color: '#8B98A8', fontWeight: '600', marginBottom: 2 },
    billingInput: {
        fontSize: 14, 
        fontWeight: '600', 
        color: '#1A2332', 
        borderWidth: 1,
        borderColor: '#E0E6ED',
        borderRadius: 6,
        padding: 8,
        backgroundColor: '#F9F9FB'
    },
    
    // Buttons
    confirmButton: { backgroundColor: '#28A745', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cancelButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#6c757d' },
    cancelButtonText: { color: '#6c757d', fontWeight: '700', fontSize: 14 },

    // Confirmation Modal Styles
    confirmationContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    confirmationContent: { width: '90%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
    confirmationHeader: { fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 40, opacity: 0.8 },
    confirmationIcon: { marginBottom: 24 },
    confirmationTitle: { fontSize: 26, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    confirmationMessage: { fontSize: 15, color: '#8B98A8', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    confirmationButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
    confirmationButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});