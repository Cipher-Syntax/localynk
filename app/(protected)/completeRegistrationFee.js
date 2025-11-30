import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import FeePaymentReviewModal from '../../components/payment/FeePaymentReviewModal'; 
import { useAuth } from '../../context/AuthContext'; 

const REGISTRATION_FEE_DETAILS = {
    amount: 500.00,
    serviceFee: 50.00,
};

const CompleteRegistrationFee = () => {
    const { user } = useAuth();
    const { feeAmount } = useLocalSearchParams(); 
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('gcash'); 
    const baseFee = parseFloat(feeAmount || REGISTRATION_FEE_DETAILS.amount) || REGISTRATION_FEE_DETAILS.amount;
    const finalServiceFee = REGISTRATION_FEE_DETAILS.serviceFee; 
    const totalToPay = baseFee + finalServiceFee;


    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleReviewPress = () => {
        if (!user?.first_name || !user?.last_name || !user?.phone_number || !user?.email) {
            Alert.alert("Missing User Data", "Essential profile information (name, email, phone) is missing. Please update your profile first.");
            return;
        }
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const billingData = {
        firstName: user?.first_name || 'N/A',
        lastName: user?.last_name || 'N/A',
        phoneNumber: user?.phone_number || 'N/A',
        email: user?.email || 'N/A',
        country: 'Philippines',
    };


    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>FINALIZE REGISTRATION</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.priceCard}>
                        <Text style={styles.cardHeader}>Guide Registration Fee</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Registration Fee</Text>
                            <Text style={styles.priceValue}>₱ {baseFee.toFixed(2).toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>App Service Fee</Text>
                            <Text style={styles.priceValue}>₱ {finalServiceFee.toFixed(2).toLocaleString()}</Text>
                        </View>

                        <View style={styles.priceDivider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₱ {totalToPay.toFixed(2).toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <Pressable 
                            style={styles.paymentOption} 
                            onPress={() => setPaymentMethod('gcash')}
                        >
                            <View style={[styles.radioButton, paymentMethod === 'gcash' && styles.radioButtonActive]}>
                                {paymentMethod === 'gcash' && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={styles.paymentOptionText}>GCash</Text>
                        </Pressable>
                        <Text style={styles.infoText}>This is a one-time fee to activate your guide profile.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information (Auto-Filled)</Text>
                        <View style={styles.billingCardReview}>
                            <View style={styles.billingRowReview}>
                                <Text style={styles.billingLabelReview}>Name:</Text>
                                <Text style={styles.billingValueReview}>{`${billingData.firstName} ${billingData.lastName}`}</Text>
                            </View>
                            <View style={styles.billingRowReview}>
                                <Text style={styles.billingLabelReview}>Email:</Text>
                                <Text style={styles.billingValueReview}>{billingData.email}</Text>
                            </View>
                            <View style={styles.billingRowReview}>
                                <Text style={styles.billingLabelReview}>Phone:</Text>
                                <Text style={styles.billingValueReview}>{billingData.phoneNumber}</Text>
                            </View>
                            <Text style={styles.infoText}>Your profile information will be used for billing and receipt generation.</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.confirmButton} onPress={handleReviewPress}>
                        <Text style={styles.confirmButtonText}>Review & Pay Registration Fee</Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <FeePaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            ...billingData,
                            baseFee: baseFee,
                            serviceFee: finalServiceFee,
                            totalPrice: totalToPay,
                            paymentMethod: paymentMethod,
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default CompleteRegistrationFee;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    contentContainer: { padding: 16, paddingBottom: 30 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A2332', marginBottom: 12 },
    cardHeader: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 10, textAlign: 'center' },
    
    priceCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1A2332', borderRadius: 12, padding: 16, marginBottom: 20 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 13, color: '#1A2332', fontWeight: '500' },
    priceValue: { fontSize: 13, color: '#1A2332', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#1A2332', marginVertical: 10 },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#1A2332' },
    totalValue: { fontSize: 15, fontWeight: '700', color: '#00A8FF' },

    paymentOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F5F7FA' },
    radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#1A2332', marginRight: 12, justifyContent: 'center', alignItems: 'center', },
    radioButtonActive: { borderColor: '#00A8FF', },
    radioButtonInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00A8FF' },
    paymentOptionText: { fontSize: 13, color: '#1A2332', fontWeight: '500' },
    infoText: { fontSize: 12, color: '#8B98A8', marginTop: 8 },

    billingCardReview: { backgroundColor: '#F5F7FA', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E0E6ED' },
    billingRowReview: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    billingLabelReview: { fontSize: 13, fontWeight: '500', color: '#8B98A8', width: '30%' },
    billingValueReview: { fontSize: 13, fontWeight: '600', color: '#1A2332', flex: 1, textAlign: 'right' },

    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});