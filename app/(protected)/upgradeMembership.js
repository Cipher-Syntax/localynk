import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/upgradeMembership.styles';

const UpgradeMembership = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [price, setPrice] = useState(null);
    const [isPaymentStarted, setIsPaymentStarted] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const pollingRef = useRef(null);
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const premiumFeatures = [
        { icon: "infinite", text: "Accept Unlimited Bookings" },
    ];

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await api.get('/api/payments/subscription-price/');
                setPrice(response.data.price);
            } catch (error) {
                console.error('Failed to fetch subscription price:', error);
                setToast({ visible: true, message: 'Could not fetch subscription price.', type: 'error' });
            }
        };

        fetchPrice();
    }, []);

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

        console.log("Starting polling for ID:", id);

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data.status;
                
                if (status === "succeeded" || status === "paid") {
                    clearInterval(pollingRef.current);
                    await refreshUser();
                    setShowConfirmation(true);
                    setIsLoading(false);
                } 
                else if (status === "failed") {
                    clearInterval(pollingRef.current);
                    setIsLoading(false);
                }
            } 
            catch (err) {
                if (err.response && err.response.status === 404) {
                    clearInterval(pollingRef.current);
                } 
            }
        }, 3000);
    };

    const handleManualVerify = async () => {
        setIsLoading(true);
        await refreshUser();
 
        setTimeout(() => {
            if (user && user.guide_tier === 'paid') {
                setShowConfirmation(true);
            } else {
                setToast({ visible: true, message: "We haven't received the confirmation yet. Please try again.", type: 'error' });
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/payments/initiate/', {
                payment_type: 'YearlySubscription',
                payment_method: 'GCash',
            });

            const data = response.data;
            const checkoutUrl = data.checkout_url || data.url || data.link || (data.data && data.data.checkout_url);
            
            let pId = data.payment_id || data.id || (data.data && data.data.payment_id);
            if (!pId && checkoutUrl) {
                const urlParts = checkoutUrl.split('/');
                pId = urlParts[urlParts.length - 1]; 
            }

            if (checkoutUrl) {
                const supported = await Linking.canOpenURL(checkoutUrl);
                if (supported) {
                    await Linking.openURL(checkoutUrl);
                    setIsPaymentStarted(true); 
                    setIsLoading(false); 
                    
                    if (pId) startPolling(pId);
                } 
                else {
                    setToast({ visible: true, message: "Cannot open payment link.", type: 'error' });
                    setIsLoading(false);
                }
            } 
            else {
                setToast({ visible: true, message: 'Could not generate payment link.', type: 'error' });
                setIsLoading(false);
            }
        } 
        catch (error) {
            console.error('Upgrade error:', error);
            const serverMsg = error.response?.data?.detail || error.response?.data?.message;
            setToast({ visible: true, message: serverMsg || 'An error occurred while trying to upgrade.', type: 'error' });
            setIsLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmation(false);
        router.replace('/(protected)/home/tourGuide');
    };

    if (showConfirmation) {
        return (
            <ScreenSafeArea edges={['bottom']} style={styles.container}>
                <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.confirmationContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle" size={120} color="#00C853" />
                        </View>
                        <Text style={styles.confirmationTitle}>You&apos;re Premium!</Text>
                        <Text style={styles.confirmationMessage}>
                            Thank you for subscribing. You now have unlimited access to accept bookings and grow your business.
                        </Text>
                        <TouchableOpacity style={styles.doneButton} onPress={handleConfirmationDismiss}>
                            <Text style={styles.doneButtonText}>Go to Dashboard</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </ScreenSafeArea>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
            <LinearGradient
                colors={['#FFFFFF', '#F3F4F6']}
                style={styles.gradientBackground}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MEMBERSHIP</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.crownContainer}>
                        <LinearGradient
                            colors={['#FFD700', '#FFB300']}
                            style={styles.iconCircle}
                        >
                            <Ionicons name="ribbon" size={40} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.mainTitle}>Upgrade to Premium</Text>
                    <Text style={styles.subtitle}>Unlock your full potential as a guide.</Text>

                    <View style={styles.pricingCard}>
                        <View style={styles.bestValueTag}>
                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                        <Text style={styles.periodText}>Yearly Subscription</Text>
                        <View style={styles.priceRow}>
                            {price ? (
                                <>
                                    <Text style={styles.currencySymbol}>₱</Text>
                                    <Text style={styles.priceText}>{price}</Text>
                                    <Text style={styles.perYearText}>/year</Text>
                                </>
                            ) : (
                                <ActivityIndicator size="large" color="#111827" />
                            )}
                        </View>
                    </View>

                    <View style={styles.featuresContainer}>
                        {premiumFeatures.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <View style={styles.checkCircle}>
                                    <Ionicons name={feature.icon} size={16} color="#1F2937" />
                                </View>
                                <Text style={styles.featureText}>{feature.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.footer}>
                    {!isPaymentStarted ? (
                        <TouchableOpacity
                            style={[styles.upgradeButton, isLoading && styles.buttonDisabled]}
                            onPress={handleUpgrade}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#0072FF', '#00C6FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {isLoading ? (
                                    <View style={styles.loadingRow}>
                                        <ActivityIndicator color="#fff" />
                                        <Text style={styles.buttonText}>Processing...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.contentRow}>
                                        <Text style={styles.buttonText}>Upgrade Now</Text>
                                        <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                         <TouchableOpacity
                            style={styles.upgradeButton}
                            onPress={handleManualVerify}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#111827', '#374151']} 
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {isLoading ? (
                                     <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.contentRow}>
                                        <Text style={styles.buttonText}>I have completed payment</Text>
                                        <Ionicons name="refresh-circle" size={24} color="#fff" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    
                    {isLoading && !isPaymentStarted && (
                        <Text style={styles.waitingText}>
                            Redirecting to payment gateway...
                        </Text>
                    )}
                     {isPaymentStarted && (
                        <Text style={styles.waitingText}>
                            Click the button above after you pay in the browser.
                        </Text>
                    )}
                </View>

            </LinearGradient>
        </SafeAreaView>
    );
};

export default UpgradeMembership;
