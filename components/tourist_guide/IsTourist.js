import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, ScrollView, TouchableOpacity, Alert, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const IsTourist = () => {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isGuideActive, setIsGuideActive] = useState(false); 
    
    const [modalVisible, setModalVisible] = useState(false);

    // --- TOAST STATE ---
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        if (user) {
            setIsGuideActive(user.is_guide_visible || false);
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const bookingRes = await api.get('/api/bookings/');
            setBookings(bookingRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
            refreshUser();
        }, [])
    );

    // --- TOAST HELPER ---
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        // Auto-hide after 3 seconds
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const toggleActiveStatus = async () => {
        const newStatus = !isGuideActive;
        setIsGuideActive(newStatus);

        try {
            await api.patch('api/guide/update-info/', { is_guide_visible: newStatus });
            if (newStatus) {
                showToast("You are now Online! Visible to tourists.", 'success');
            } else {
                showToast("You are now Offline. Hidden from search.", 'neutral');
            }
        } catch (error) {
            setIsGuideActive(!newStatus);
            showToast("Failed to update status. Check internet.", 'error');
        }
    };

    const handleDecision = async (id, decision) => {
        if (user.guide_tier === 'free' && user.booking_count >= 1 && decision === 'accept') {
            Alert.alert(
                "Upgrade Required",
                "You have reached your one-booking limit on the Free Tier. Please upgrade to accept more bookings.",
                [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "Upgrade Now", onPress: () => router.push('/(protected)/upgradeMembership') }
                ]
            );
            return;
        }

        try {
            const newStatus = decision === 'accept' ? 'Accepted' : 'Declined';
            await api.patch(`/api/bookings/${id}/status/`, { status: newStatus });
            
            // Refresh data
            fetchBookings();
            refreshUser(); 
            
            // Aesthetic Feedback
            if (decision === 'accept') {
                showToast("Booking Accepted successfully!", 'success');
            } else {
                showToast("Booking Declined.", 'neutral');
            }

        } catch (error) {
            console.error(`Failed to ${decision} booking:`, error);
            
            if (error.response && error.response.status === 403) {
                const serverMessage = typeof error.response.data === 'object' 
                    ? JSON.stringify(error.response.data) 
                    : error.response.data;
                showToast(`Permission Denied: ${serverMessage}`, 'error');
            } else {
                showToast(`Failed to ${decision} booking.`, 'error');
            }
        }
    };

    return (
        <View style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* --- HEADER --- */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/localynk_images/header.png')} 
                    style={styles.headerImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                />
                <Text style={styles.headerTitle}>TOUR GUIDES DASHBOARD</Text>

                <TouchableOpacity 
                    style={styles.tierBadge} 
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name={user?.guide_tier === 'paid' ? "ribbon" : "information-circle"} 
                        size={16} 
                        color="#fff" 
                    />
                    <Text style={styles.tierBadgeText}>
                        {user?.guide_tier === 'paid' ? 'PREMIUM GUIDE' : 'FREE TIER'}
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color="#fff" style={{marginLeft: 2}}/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
                
                {/* --- STATUS TOGGLE --- */}
                <View style={styles.statusToggleContainer}>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.readyPromptText}>
                            {isGuideActive ? "You are currently active" : "Are you ready to be a local guide?"}
                        </Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isGuideActive ? '#00c853' : '#B0B8C4' }]} />
                            <Text style={[styles.statusLabel, { color: isGuideActive ? '#00c853' : '#B0B8C4' }]}>
                                {isGuideActive ? 'ONLINE' : 'OFFLINE'}
                            </Text>
                        </View>
                        <Text style={styles.statusSubLabel}>
                            {isGuideActive ? "Visible to tourists." : "Hidden from bookings."}
                        </Text>
                    </View>

                    <Switch
                        trackColor={{ false: "#E0E0E0", true: "#b9f6ca" }}
                        thumbColor={isGuideActive ? "#00c853" : "#f4f3f4"}
                        onValueChange={toggleActiveStatus}
                        value={isGuideActive}
                    />
                </View>

                {/* --- STATS CARDS --- */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>127</Text>
                        <Text style={styles.statLabel}>Total Bookings</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{bookings.length}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>15</Text>
                        <Text style={styles.statLabel}>Completed Tours</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>4.8</Text>
                        <Text style={styles.statLabel}>Average Rating</Text>
                    </View>
                </View>

                {/* --- ACTION BUTTONS & BOOKINGS --- */}
                <View style={styles.bookingsSection}>
                    {/* ACTIONS HEADER */}
                    <View style={styles.action}>
                        <Text style={styles.bookingsTitle}>QUICK ACTIONS</Text>

                        {/* UPDATE INFO BUTTON (Always visible) */}
                        <TouchableOpacity 
                            style={styles.updateInfo}
                            onPress={() => router.push({pathname: "/(protected)/UpdateGuideInfoForm"})}
                        >
                            <Text style={styles.updateInfoBtnText}>Update Info</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CREATION BUTTONS ROW */}
                    <View style={styles.creationButtonsRow}>
                        <TouchableOpacity 
                            style={styles.addAccommodationBtn}
                            onPress={() => router.push({pathname: "/(protected)/addAccommodation"})}
                        >
                            <Ionicons name="bed" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.addAccommodationBtnText}>Add Accommodation</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.addTourBtn}
                            onPress={() => router.push({pathname: "/(protected)/addTour"})}
                        >
                            <Ionicons name="map" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.addTourBtnText}>Add Tour</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.bookingsTitle, { marginTop: 25, marginBottom: 15 }]}>BOOKINGS</Text>

                    {/* BOOKING LIST */}
                    {bookings.map((booking) => (
                        <View key={booking.id} style={styles.bookingCard}>
                            <View style={styles.bookingHeader}>
                                <View style={styles.avatarContainer}>
                                    {/* Replaced external Image with Icon */}
                                    <Ionicons name="person-circle" size={54} color="#B0B8C4" />
                                </View>
                                <View style={styles.bookingInfo}>
                                    <View style={styles.nameStatusRow}>
                                        <Text style={styles.guideNameWaiting}>{booking.tourist_username}</Text>
                                        <View style={styles.statusContainer}>
                                            {booking.status === 'Pending' && <Ionicons name="time" size={14} color="#FFD700" />}
                                            {booking.status === 'Accepted' && <Ionicons name="checkmark-circle" size={14} color="#00c853" />}
                                            {booking.status === 'Active' && <Ionicons name="play-circle" size={14} color="#2979FF" />}
                                            {booking.status === 'Declined' && <Ionicons name="close-circle" size={14} color="#ff5252" />}
                                            <Text style={[styles.statusText, { marginLeft: 4 }]}>{booking.status}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.metaInfo}>
                                        <View style={styles.dates}>
                                            <Ionicons name="calendar-outline" size={12} color="#fff" />
                                            <Text style={styles.startDate}>{booking.check_in} - {booking.check_out}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* ACTIONS (Accept/Decline) */}
                            {booking.status === 'Pending' && (
                                <View style={styles.decisionRow}>
                                    <TouchableOpacity
                                        style={[styles.decisionButton, styles.rejectButton]}
                                        onPress={() => handleDecision(booking.id, 'decline')}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                        <Text style={styles.decisionText}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.decisionButton, styles.acceptButton]}
                                        onPress={() => handleDecision(booking.id, 'accept')}
                                    >
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                        <Text style={styles.decisionText}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity style={styles.messageButton}>
                                <Text style={styles.messageButtonText}>Message Client</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* --- TOAST NOTIFICATION COMPONENT --- */}
            {toast.visible && (
                <View style={[
                    styles.toastContainer, 
                    toast.type === 'error' ? styles.toastError : 
                    toast.type === 'neutral' ? styles.toastNeutral : 
                    styles.toastSuccess
                ]}>
                    <Ionicons 
                        name={
                            toast.type === 'error' ? "alert-circle" : 
                            toast.type === 'neutral' ? "information-circle" : 
                            "checkmark-circle"
                        } 
                        size={24} 
                        color="#fff" 
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Membership Plans</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <View style={[styles.planBox, styles.freePlanBox]}>
                                <View style={styles.planHeader}>
                                    <Ionicons name="person-outline" size={24} color="#666" />
                                    <Text style={styles.planName}>Free Tier</Text>
                                </View>
                                <Text style={styles.planDescription}>For casual guides getting started.</Text>
                                
                                <View style={styles.benefitRow}>
                                    <Ionicons name="warning" size={16} color="#F57C00" />
                                    <Text style={styles.benefitText}>Limit: 1 Booking Only</Text>
                                </View>
                            </View>

                            <View style={styles.divider}>
                                <Text style={styles.dividerText}>VS</Text>
                            </View>

                            {/* Paid Tier Column */}
                            <View style={[styles.planBox, styles.paidPlanBox]}>
                                <View style={styles.planHeader}>
                                    <Ionicons name="ribbon" size={24} color="#FFD700" />
                                    <Text style={styles.paidPlanName}>Premium Tier</Text>
                                </View>
                                <Text style={styles.planDescription}>For professional guides.</Text>
                                
                                <View style={styles.benefitRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#00c853" />
                                    <Text style={styles.benefitText}>Unlimited Bookings</Text>
                                </View>
                            </View>
                        </ScrollView>
                        
                        {user?.guide_tier !== 'paid' && (
                            <TouchableOpacity 
                                style={styles.modalUpgradeBtn}
                                onPress={() => {
                                    setModalVisible(false);
                                    router.push('/(protected)/upgradeMembership');
                                }}
                            >
                                <LinearGradient
                                    colors={['#0072FF', '#00C6FF']}
                                    style={styles.gradientBtn}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.modalUpgradeText}>Upgrade to Premium</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        
                        {user?.guide_tier === 'paid' && (
                             <View style={styles.activeSubContainer}>
                                <Text style={styles.activeSubText}>
                                    You are currently on Premium plan.
                                </Text>
                                <Text style={styles.activeSubDate}>
                                    Expires: {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'N/A'}
                                </Text>
                             </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default IsTourist;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f8f9fa'
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center'
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    
    // --- NEW TIER TRIGGER BADGE ---
    tierBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    tierBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 6,
        marginRight: 4,
        letterSpacing: 0.5
    },

    mainContent: {
        flexDirection: "column",
        gap: 20
    },

    // --- STATUS TOGGLE STYLES ---
    statusToggleContainer: {
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 15,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    statusTextContainer: {
        flex: 1,
    },
    readyPromptText: {
        fontSize: 12,
        color: '#8B98A8',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        gap: 6
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    statusSubLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },

    // --- STATS ---
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        gap: 10,
        marginTop: 5,
        marginBottom: 100
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        // Shadow
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff'
    },
    statLabel: {
        fontSize: 12,
        color: '#B0B8C4',
        marginTop: 4,
        fontWeight: '500'
    },

    bookingsSection: {
        padding: 15,
    },
    action: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
    },
    bookingsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#253347',
        letterSpacing: 0.5,
    },

    // --- BUTTON STYLES ---
    creationButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5
    },
    addAccommodationBtn: {
        flex: 1,
        backgroundColor: '#0072FF',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addAccommodationBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },
    addTourBtn: {
        flex: 1,
        backgroundColor: '#00C6FF',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addTourBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },
    updateInfo: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#253347'
    },
    updateInfoBtnText: {
        color: '#253347',
        fontWeight: '700',
        fontSize: 11,
        textAlign: "center",
    },

    // Booking Card Styles
    bookingCard: {
        backgroundColor: '#253347',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 12
    },
    // REMOVED avatar style that had image props
    bookingInfo: {
        flex: 1
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6
    },
    guideNameWaiting: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    },
    statusText: {
        fontSize: 12,
        color: '#B0B8C4',
        fontWeight: '500'
    },
    metaInfo: {
        flexDirection: 'column',
    },
    dates: {
        flexDirection: "row",
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6
    },
    startDate: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600'
    },
    endDate: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600'
    },
    decisionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10
    },
    decisionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 10,
        flex: 1,
    },
    acceptButton: {
        backgroundColor: '#00c853'
    },
    rejectButton: {
        backgroundColor: '#ff5252'
    },
    decisionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 6,
    },
    messageButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    messageButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700'
    },

    // --- TOAST STYLES ---
    toastContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 1000,
    },
    toastSuccess: {
        backgroundColor: '#00c853', // Green
    },
    toastError: {
        backgroundColor: '#ff5252', // Red
    },
    toastNeutral: {
        backgroundColor: '#253347', // Dark Blue (matches theme)
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 12,
    },

    // --- NEW MODAL STYLES ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#253347',
    },
    modalScroll: {
        marginBottom: 20
    },
    planBox: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    freePlanBox: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    paidPlanBox: {
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10
    },
    planName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563'
    },
    paidPlanName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0284C7'
    },
    planDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8
    },
    benefitText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500'
    },
    divider: {
        alignItems: 'center',
        marginVertical: 10,
    },
    dividerText: {
        backgroundColor: '#E5E7EB',
        color: '#6B7280',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: '800'
    },
    modalUpgradeBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4
    },
    gradientBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 10
    },
    modalUpgradeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700'
    },
    activeSubContainer: {
        alignItems: 'center',
        padding: 10
    },
    activeSubText: {
        color: '#00c853',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4
    },
    activeSubDate: {
        color: '#666',
        fontSize: 12
    }
});