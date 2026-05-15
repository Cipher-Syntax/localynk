import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import FeePaymentReviewModal from '../../components/payment/FeePaymentReviewModal'; 
import { useAuth } from '../../context/AuthContext'; 
import Toast from '../../components/Toast';
import { formatPHPhoneLocal, normalizePHPhone } from '../../utils/phoneNumber';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/completePayment.styles';

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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    
    const baseFee = parseFloat(feeAmount || REGISTRATION_FEE_DETAILS.amount) || REGISTRATION_FEE_DETAILS.amount;
    const finalServiceFee = REGISTRATION_FEE_DETAILS.serviceFee; 
    const totalToPay = baseFee + finalServiceFee;

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleReviewPress = () => {
        const normalizedPhone = normalizePHPhone(user?.phone_number || '');
        if (!user?.first_name || !user?.last_name || !normalizedPhone || !user?.email) {
            setToast({ visible: true, message: "Essential profile information is missing. Please update your profile.", type: 'error' });
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
        phoneNumber: formatPHPhoneLocal(user?.phone_number || '') || 'N/A',
        email: user?.email || 'N/A',
        country: 'Philippines',
    };

    return (
        <ScrollView style={styles.container}>
            <ScreenSafeArea edges={['bottom', 'top']}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

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
            </ScreenSafeArea>
        </ScrollView>
    );
};

export default CompleteRegistrationFee;
