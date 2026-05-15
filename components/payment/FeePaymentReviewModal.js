import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext";
import { formatPHPhoneLocal } from '../../utils/phoneNumber';
import { styles } from './styles/FeePaymentReviewModal.styles';

const FeePaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [showPaymentLink, setShowPaymentLink] = useState(false);

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
            <ScrollView style={styles.container}>
                <SafeAreaView edges={['bottom']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                            <Ionicons name="close" size={28} color="#1A2332" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>REGISTRATION FEE REVIEW</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.contentContainer}>
                        {/* UPDATED LABELS HERE */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
                            <View style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Guide Registration Fee</Text>
                                    <Text style={styles.priceValue}>₱ {baseFee?.toFixed(2).toLocaleString() || '0.00'}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Platform Processing Fee</Text>
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
                                        <Text style={styles.billingValue}>{formatPHPhoneLocal(phoneNumber)}</Text>
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

