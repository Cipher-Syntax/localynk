import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    ActivityIndicator, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    Alert, 
    RefreshControl
} from "react-native";
import { IsTourist, Action, PendingGuide } from "../../../components/tourist_guide"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Adjust this import path based on your project structure
import api from '../../../api/api'; 

export default function TourGuide() {
    const [loading, setLoading] = useState(true);
    const { role, isLoading: isAuthLoading, refreshUser, user } = useAuth();
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    
    // --- SUBSCRIPTION STATE ---
    const [subscriptionPrice, setSubscriptionPrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(true);

    // --- REFRESH STATE ---
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const prevRoleRef = useRef();

    // --- REFRESH HANDLER ---
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            console.log("Pull-to-refresh: Updating user data...");
            await refreshUser();
        } catch (error) {
            console.error("Refresh failed", error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshUser]);

    // --- FETCH PRICE EFFECT ---
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await api.get('/api/payments/subscription-price/');
                setSubscriptionPrice(response.data.price);
            } catch (error) {
                console.error('Failed to fetch subscription price:', error);
                // Fallback price or handle error silently
            } finally {
                setLoadingPrice(false);
            }
        };

        if (role === 'guide') {
            fetchPrice();
        }
    }, [role]);

    useEffect(() => {
        if (prevRoleRef.current === 'pending_guide' && role === 'guide') {
            setShowWelcomeModal(true);
        }
        prevRoleRef.current = role;
    }, [role]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading || isAuthLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const handleSubscription = () => {
        setShowWelcomeModal(false);
        router.push('/(protected)/upgrade');
    };
    
    // --- CONDITIONAL RENDERING ---

    // 1. Fully Approved Guide
    if (role === 'guide') {
        return (
            <View style={styles.safeArea}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={["#00C6FF"]} 
                        />
                    }
                >
                    <IsTourist /> 
                </ScrollView>

                {/* --- REDESIGNED WELCOME MODAL --- */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showWelcomeModal}
                    onRequestClose={() => setShowWelcomeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            {/* Header Icon */}
                            <View style={styles.crownContainer}>
                                <LinearGradient
                                    colors={['#FFD700', '#FFB300']}
                                    style={styles.iconCircle}
                                >
                                    <Ionicons name="ribbon" size={40} color="#fff" />
                                </LinearGradient>
                            </View>

                            <Text style={styles.modalTitle}>Welcome, Local Guide!</Text>
                            <Text style={styles.modalSubtitle}>Your application has been approved.</Text>
                            
                            {/* Pricing Section (Matches Upgrade Design) */}
                            <View style={styles.pricingSection}>
                                <View style={styles.bestValueTag}>
                                    <Text style={styles.bestValueText}>UNLOCK POTENTIAL</Text>
                                </View>
                                <Text style={styles.modalBodyText}>
                                    You are currently on the <Text style={{fontWeight:'bold'}}>Free Tier</Text> (1 booking limit).
                                    Upgrade to accept unlimited bookings!
                                </Text>

                                <View style={styles.priceRow}>
                                    {loadingPrice ? (
                                        <ActivityIndicator size="small" color="#111827" />
                                    ) : (
                                        <>
                                            <Text style={styles.currencySymbol}>₱</Text>
                                            <Text style={styles.priceText}>{subscriptionPrice}</Text>
                                            <Text style={styles.perYearText}>/year</Text>
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Buttons */}
                            <TouchableOpacity
                                style={styles.subscribeButton}
                                onPress={handleSubscription}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#0072FF', '#00C6FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.buttonText}>Subscribe Now</Text>
                                    <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowWelcomeModal(false)}
                            >
                                <Text style={styles.closeButtonText}>Maybe Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
    
    // 2. Pending Guide Review
    if (role === 'pending_guide') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={["#00C6FF"]} 
                        />
                    }
                >
                    <PendingGuide /> 
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 3. Tourist (Default)
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={["#00C6FF"]} 
                    />
                }
            >
                <Action />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F7FA"
    },
    scrollContent: { 
        flexGrow: 1 
    },
    
    // --- MODAL STYLES ---
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay for focus
    },
    modalCard: {
        width: '85%',
        backgroundColor: "white",
        borderRadius: 24,
        padding: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10
    },
    crownContainer: {
        marginTop: -50, // Pull icon above the card
        marginBottom: 15,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF', 
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: "center",
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: "center",
        marginBottom: 20,
    },
    pricingSection: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    bestValueTag: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    bestValueText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 10,
    },
    modalBodyText: {
        fontSize: 13,
        color: '#374151',
        textAlign: "center",
        marginBottom: 15,
        lineHeight: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currencySymbol: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '600',
        marginTop: 6,
        marginRight: 2,
    },
    priceText: {
        fontSize: 36,
        color: '#111827',
        fontWeight: '800',
    },
    perYearText: {
        fontSize: 14,
        color: '#6B7280',
        alignSelf: 'flex-end',
        marginBottom: 8,
        marginLeft: 2,
    },
    subscribeButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        marginBottom: 12,
    },
    gradientButton: {
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    closeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    closeButtonText: {
        color: "#9CA3AF",
        fontWeight: "600",
        fontSize: 14,
    }
});