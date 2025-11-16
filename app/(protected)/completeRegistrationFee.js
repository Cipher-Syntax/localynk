import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeePaymentReviewModal from '../../components/payment/FeePaymentReviewModal'; // <-- NEW IMPORT
import { useLocalSearchParams } from 'expo-router';

// Mock data for the registration fee
const REGISTRATION_FEE_DETAILS = {
    amount: 500.00, // Fixed registration fee
    serviceFee: 50.00, // App's portion of the fee (example)
};

const CompleteRegistrationFee = () => {
    // Allows passing the required fee amount if necessary (e.g., from an API or notification)
    const { feeAmount } = useLocalSearchParams(); 

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('gcash'); 

    // Calculate final fee using the mock data or parameter
    const baseFee = parseFloat(feeAmount || REGISTRATION_FEE_DETAILS.amount) || REGISTRATION_FEE_DETAILS.amount;
    const finalServiceFee = REGISTRATION_FEE_DETAILS.serviceFee; 
    const totalToPay = baseFee + finalServiceFee;


    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleReviewPress = () => {
        if (!firstName || !lastName || !phoneNumber || !country || !email) {
            alert("Please fill out all billing information.");
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
                    {/* Fee Details Card */}
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

                    {/* Payment Method - Simplified to GCash only */}
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

                    {/* Billing Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information</Text>
                        <View style={styles.billingRow}>
                            <TextInput
                                style={styles.billingInput}
                                placeholder="First Name"
                                placeholderTextColor="#8B98A8"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                            <TextInput
                                style={styles.billingInput}
                                placeholder="Last Name"
                                placeholderTextColor="#8B98A8"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                        <View style={styles.billingRow}>
                            <TextInput
                                style={styles.billingInput}
                                placeholder="Phone Number"
                                placeholderTextColor="#8B98A8"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={styles.billingInput}
                                placeholder="Country (e.g., Philippines)"
                                placeholderTextColor="#8B98A8"
                                value={country}
                                onChangeText={setCountry}
                            />
                        </View>
                        <TextInput
                            style={[styles.billingInput, styles.fullWidthInput]}
                            placeholder="Email"
                            placeholderTextColor="#8B98A8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
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
                            firstName,
                            lastName,
                            phoneNumber,
                            country,
                            email,
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

// --- STYLES (Adjusted/Reused from Payment.jsx) ---
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

    billingRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    billingInput: { flex: 1, borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1A2332', backgroundColor: '#fff' },
    fullWidthInput: { width: '100%' },

    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});