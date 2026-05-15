import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Modal, TouchableOpacity, RefreshControl, StatusBar, Platform } from "react-native";
import { IsTourist, Action, PendingGuide } from "../../../components/tourist_guide"; 
import { ScreenSafeArea } from "../../../components";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../../api/api'; 
import { styles } from "./styles/tourGuide.styles";

export default function TourGuide() {
    const [loading, setLoading] = useState(true);
    const { role, isLoading: isAuthLoading, refreshUser } = useAuth();
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [subscriptionPrice, setSubscriptionPrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(true);
    const [refreshing, setRefreshing] = useState(false)
    const router = useRouter();
    const prevRoleRef = useRef();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            console.log("Pull-to-refresh: Updating user data...");
            await refreshUser();
        } 
        catch (error) {
            console.error("Refresh failed", error);
        } 
        finally {
            setRefreshing(false);
        }
    }, [refreshUser]);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await api.get('/api/payments/subscription-price/');
                setSubscriptionPrice(response.data.price);
            } 
            catch (error) {
                console.error('Failed to fetch subscription price:', error);
            } 
            finally {
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

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('transparent');
                StatusBar.setTranslucent(true);
            }
        }, [])
    );

    if (loading || isAuthLoading) {
        return (
            <ScreenSafeArea style={styles.safeArea} statusBarStyle="light-content">
                <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
                    <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                    <View style={{ padding: 16, marginTop: 10 }}>
                        <View style={{ height: 180, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                            <View style={{ flex: 1, height: 100, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                            <View style={{ flex: 1, height: 100, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                        </View>
                        <View style={{ height: 150, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                    </View>
                </View>
            </ScreenSafeArea>
        );
    }

    const handleSubscription = () => {
        setShowWelcomeModal(false);
        router.push('/(protected)/upgradeMembership');
    };
    
    if (role === 'guide') {
        return (
            <ScreenSafeArea style={styles.safeArea} statusBarStyle="light-content" edges={[]}>
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

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showWelcomeModal}
                    onRequestClose={() => setShowWelcomeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
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
            </ScreenSafeArea>
        );
    }
    
    if (role === 'pending_guide') {
        return (
            <ScreenSafeArea style={styles.safeArea} statusBarStyle="light-content">
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
            </ScreenSafeArea>
        );
    }

    return (
        <ScreenSafeArea style={styles.safeArea} statusBarStyle="light-content">
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
        </ScreenSafeArea>
    );
}
