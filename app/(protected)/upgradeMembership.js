import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Modal, ActivityIndicator, ScrollView, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const UpgradeMembership = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [price, setPrice] = useState(null);
    const [isPaymentStarted, setIsPaymentStarted] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const pollingRef = useRef(null);
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const premiumFeatures = [
        { icon: "infinite", text: "Accept Unlimited Bookings" },
        // { icon: "shield-checkmark", text: "Verified Guide Badge" },
        // { icon: "trending-up", text: "Top Search Visibility" },
        // { icon: "star", text: "Priority Support" },
    ];

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await api.get('/api/payments/subscription-price/');
                setPrice(response.data.price);
            } catch (error) {
                console.error('Failed to fetch subscription price:', error);
                Alert.alert('Error', 'Could not fetch subscription price.');
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
                } else if (status === "failed") {
                    clearInterval(pollingRef.current);
                    setIsLoading(false);
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    console.log("Polling stopped: ID not found in backend (404). Switching to manual verification.");
                    clearInterval(pollingRef.current);
                } else {
                    console.log("Polling check failed (network):", err.message);
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
                Alert.alert(
                    "Payment Not Detected Yet", 
                    "We haven't received the confirmation yet. Please ensure you completed the payment in the browser, then try clicking this button again."
                );
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

            console.log("PAYMENT INIT RESPONSE:", JSON.stringify(response.data, null, 2));

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
                } else {
                    Alert.alert("Error", "Cannot open payment link.");
                    setIsLoading(false);
                }
            } else {
                Alert.alert('Payment Error', 'Could not generate payment link.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            const serverMsg = error.response?.data?.detail || error.response?.data?.message;
            Alert.alert('Error', serverMsg || 'An error occurred while trying to upgrade.');
            setIsLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmation(false);
        router.replace('/(protected)/home/tourGuide');
    };

    if (showConfirmation) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={styles.gradientBackground}
                >
                    <View style={styles.confirmationContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="checkmark-circle" size={120} color="#00C853" />
                        </View>
                        <Text style={styles.confirmationTitle}>You're Premium!</Text>
                        <Text style={styles.confirmationMessage}>
                            Thank you for subscribing. You now have unlimited access to accept bookings and grow your business.
                        </Text>
                        <TouchableOpacity style={styles.doneButton} onPress={handleConfirmationDismiss}>
                            <Text style={styles.doneButtonText}>Go to Dashboard</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', 
    },
    gradientBackground: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    headerTitle: {
        color: '#9CA3AF',
        fontSize: 12,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    crownContainer: {
        marginTop: 20,
        marginBottom: 20,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF8E1', 
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280', 
        textAlign: 'center',
        marginBottom: 30,
    },
    
    pricingCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 30,
        position: 'relative',
    },
    bestValueTag: {
        position: 'absolute',
        top: -12,
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bestValueText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 10,
        letterSpacing: 0.5,
    },
    periodText: {
        color: '#6B7280', 
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    currencySymbol: {
        fontSize: 24,
        color: '#111827',
        fontWeight: '600',
        marginTop: 8,
        marginRight: 4,
    },
    priceText: {
        fontSize: 48,
        color: '#111827',
        fontWeight: '800',
    },
    perYearText: {
        fontSize: 16,
        color: '#6B7280',
        alignSelf: 'flex-end',
        marginBottom: 10,
        marginLeft: 4,
    },
    cancelText: {
        color: '#9CA3AF', 
        fontSize: 12,
    },

    featuresContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    featureText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB', 
    },
    upgradeButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.8,
    },
    gradientButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    waitingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },

    confirmationContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    iconContainer: {
        marginBottom: 30,
        shadowColor: '#00C853',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    confirmationTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827', 
        marginBottom: 15,
    },
    confirmationMessage: {
        fontSize: 16,
        color: '#6B7280', 
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    doneButton: {
        backgroundColor: '#111827', 
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    doneButtonText: {
        color: '#FFFFFF', // White text
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default UpgradeMembership;