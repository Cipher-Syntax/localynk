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
    const [isGuideActive, setIsGuideActive] = useState(false); 
    const [modalVisible, setModalVisible] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Progress Flags from Backend
    const setupProgress = user?.setup_progress || { has_info: false, has_accommodation: false, has_tour: false };

    useEffect(() => {
        if (user) {
            setIsGuideActive(user.is_guide_visible || false);
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const bookingRes = await api.get('/api/bookings/', {
                params: { view_as: 'guide' }
            });
            // Filter to show primarily Confirmed bookings (Upcoming Trips)
            // You can also show Completed if you like.
            const sorted = bookingRes.data.filter(b => b.status === 'Confirmed' || b.status === 'Completed')
                                          .sort((a,b) => new Date(b.check_in) - new Date(a.check_in));
            setBookings(sorted);
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

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
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
                showToast("You are now Online!", 'success');
            } else {
                showToast("You are now Offline.", 'neutral');
            }
        } catch (error) {
            setIsGuideActive(!newStatus);
            showToast("Failed to update status.", 'error');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Confirmed':
                return { color: '#00E676', bg: 'rgba(0, 230, 118, 0.15)', icon: 'checkmark-circle', label: 'Confirmed Trip' };
            case 'Completed':
                return { color: '#2979FF', bg: 'rgba(41, 121, 255, 0.15)', icon: 'flag', label: 'Completed' };
            case 'Cancelled':
                return { color: '#FF5252', bg: 'rgba(255, 82, 82, 0.15)', icon: 'close-circle', label: 'Cancelled' };
            default:
                return { color: '#B0B8C4', bg: 'rgba(176, 184, 196, 0.15)', icon: 'help-circle', label: status };
        }
    };

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const ratingValue = user?.average_rating ? parseFloat(user.average_rating).toFixed(1) : "0.0";

    const statsData = [
        { label: "Total Trips", value: totalBookings.toString(), icon: "stats-chart", color: "#00C6FF", subtext: "All time" },
        { label: "Upcoming", value: confirmedBookings.toString(), icon: "calendar", color: "#00E676", subtext: "Locked dates" },
        { label: "Completed", value: completedBookings.toString(), icon: "checkmark-done-circle", color: "#FFD700", subtext: "Successful tours" },
        { label: "Rating", value: ratingValue, icon: "star", color: "#FFAB00", subtext: "Average" }
    ];

    const renderChecklistItem = (stepNumber, title, description, isCompleted, isCurrent, route) => {
        const isActive = isCurrent && !isCompleted;
        const isDone = isCompleted;
        return (
            <TouchableOpacity 
                style={[styles.stepCard, isActive && styles.stepCardActive, isDone && styles.stepCardDone]}
                onPress={() => router.push({ pathname: route })}
                activeOpacity={0.7}
            >
                {isActive && (
                    <View style={styles.startBadge}><Text style={styles.startBadgeText}>START HERE</Text></View>
                )}
                <View style={styles.stepRow}>
                    <View style={[styles.stepNumberContainer, isActive && styles.stepNumberContainerActive, isDone && styles.stepNumberContainerDone]}>
                        {isDone ? <Ionicons name="checkmark" size={18} color="#fff" /> : <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{stepNumber}</Text>}
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive, isDone && styles.stepTitleDone]}>{title}</Text>
                        <Text style={styles.stepDesc}>{description}</Text>
                    </View>
                    <View style={[styles.chevronContainer, isActive && styles.chevronContainerActive, isDone && styles.chevronContainerDone]}>
                        <Ionicons name={isDone ? "create-outline" : "chevron-forward"} size={20} color={isActive ? "#0072FF" : (isDone ? "#00C853" : "#B0B8C4")} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay} />
                <Text style={styles.headerTitle}>TOUR GUIDES DASHBOARD</Text>

                <TouchableOpacity style={styles.tierBadge} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                    <Ionicons name={user?.guide_tier === 'paid' ? "ribbon" : "information-circle"} size={16} color="#fff" />
                    <Text style={styles.tierBadgeText}>{user?.guide_tier === 'paid' ? 'PREMIUM GUIDE' : 'FREE TIER'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.statusToggleContainer}>
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.readyPromptText}>{isGuideActive ? "You are currently active" : "Are you ready to be a local guide?"}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isGuideActive ? '#00c853' : '#B0B8C4' }]} />
                            <Text style={[styles.statusLabel, { color: isGuideActive ? '#00c853' : '#B0B8C4' }]}>{isGuideActive ? 'ONLINE' : 'OFFLINE'}</Text>
                        </View>
                    </View>
                    <Switch trackColor={{ false: "#E0E0E0", true: "#b9f6ca" }} thumbColor={isGuideActive ? "#00c853" : "#f4f3f4"} onValueChange={toggleActiveStatus} value={isGuideActive} />
                </View>

                <View style={styles.statsGrid}>
                    {statsData.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={styles.statIconBg}><Ionicons name={stat.icon} size={18} color={stat.color} /></View>
                                <Text style={styles.statValue}>{stat.value}</Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                                <Text style={styles.statSubtext}>{stat.subtext}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.bookingsSection}>
                    <Text style={styles.sectionTitle}>GUIDE SETUP CHECKLIST</Text>
                    {renderChecklistItem(1, "Update Guide Info", "Set your profile & daily rates", setupProgress.has_info, !setupProgress.has_info, "/(protected)/UpdateGuideInfoForm")}
                    <View style={styles.connectorContainer}><View style={[styles.dottedLine, setupProgress.has_info && { borderColor: '#00C853', borderStyle: 'solid' }]} /></View>
                    {renderChecklistItem(2, "Add Accommodation", "List places for tourists to stay", setupProgress.has_accommodation, setupProgress.has_info && !setupProgress.has_accommodation, "/(protected)/addAccommodation")}
                    <View style={styles.connectorContainer}><View style={[styles.dottedLine, setupProgress.has_accommodation && { borderColor: '#00C853', borderStyle: 'solid' }]} /></View>
                    {renderChecklistItem(3, "Add Tour Packages", "Create your unique tour offers", setupProgress.has_tour, setupProgress.has_accommodation && !setupProgress.has_tour, "/(protected)/addTour")}

                    <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 15 }]}>UPCOMING TRIPS</Text>

                    {bookings.length === 0 ? (
                         <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={40} color="#B0B8C4" />
                            <Text style={styles.emptyStateText}>No confirmed trips yet.</Text>
                        </View>
                    ) : (
                        bookings.map((booking) => {
                            const statusStyle = getStatusStyles(booking.status);
                            return (
                                <View key={booking.id} style={styles.bookingCard}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.userInfo}>
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarLetter}>{booking.tourist_username ? booking.tourist_username.charAt(0).toUpperCase() : 'U'}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.touristName}>{booking.tourist_username || 'Unknown User'}</Text>
                                                <Text style={styles.touristRole}>Tourist</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} style={{marginRight: 4}}/>
                                            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <View style={styles.dateContainer}>
                                            <View style={styles.dateItem}>
                                                <Text style={styles.dateLabel}>Check In</Text>
                                                <Text style={styles.dateValue}>{booking.check_in}</Text>
                                            </View>
                                            <View style={styles.dateDivider} />
                                            <View style={styles.dateItem}>
                                                <Text style={styles.dateLabel}>Check Out</Text>
                                                <Text style={styles.dateValue}>{booking.check_out}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.messageBtn}
                                        onPress={() => router.push({
                                            pathname: '/(protected)/message',
                                            params: { partnerId: booking.tourist_id, partnerName: booking.tourist_username }
                                        })}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={18} color="#fff" style={{marginRight: 8}} />
                                        <Text style={styles.messageBtnText}>Message Client</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Re-using modal & toast styles from previous code... */}
            {toast.visible && (
                <View style={[styles.toastContainer, styles.toastSuccess]}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}
            
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                         <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Membership Plans</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>
                        {/* Plan Content... */}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default IsTourist;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    tierBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    tierBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 6 },
    mainContent: { flexDirection: "column", gap: 15, paddingBottom: 40 },
    statusToggleContainer: { width: '90%', alignSelf: 'center', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
    statusTextContainer: { flex: 1 },
    readyPromptText: { fontSize: 12, color: '#8B98A8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 18, fontWeight: '800' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15, gap: 10, marginTop: 5 },
    statCard: { backgroundColor: '#253347', borderRadius: 12, padding: 12, width: '48%', height: 100, justifyContent: 'space-between', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 30, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 13, color: '#B0B8C4', fontWeight: '600' },
    statSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    bookingsSection: { padding: 15, marginTop: 0 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#253347', letterSpacing: 0.5, marginBottom: 15, marginTop: 5 },
    stepCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: '#F0F0F0', position: 'relative', overflow: 'hidden' },
    stepCardActive: { backgroundColor: '#fff', borderColor: '#0072FF', borderWidth: 2, shadowColor: '#0072FF', shadowOpacity: 0.15 },
    stepCardDone: { borderColor: '#00C853', backgroundColor: '#F9FFF9' },
    startBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#0072FF', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
    startBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepNumberContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    stepNumberContainerActive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0072FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    stepNumberContainerDone: { backgroundColor: '#00C853', borderColor: '#00C853' },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { fontSize: 14, fontWeight: '700', color: '#fff' },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    stepTitleActive: { fontSize: 16, fontWeight: '800', color: '#0072FF', marginBottom: 2 },
    stepTitleDone: { color: '#2E7D32', textDecorationLine: 'line-through' },
    stepDesc: { fontSize: 12, color: '#6B7280' },
    chevronContainer: { paddingLeft: 10, justifyContent: 'center' },
    chevronContainerActive: { paddingLeft: 10, justifyContent: 'center', backgroundColor: '#F0F9FF', width: 36, height: 36, borderRadius: 18, alignItems: 'center' },
    chevronContainerDone: { backgroundColor: '#E8F5E9', width: 36, height: 36, borderRadius: 18, alignItems: 'center' },
    connectorContainer: { paddingLeft: 34, height: 16, justifyContent: 'center' },
    dottedLine: { width: 2, height: '100%', borderStyle: 'dotted', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 1 },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#B0B8C4' },
    emptyStateText: { marginTop: 10, color: '#B0B8C4', fontSize: 14 },
    bookingCard: { backgroundColor: '#253347', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#253347', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '800' },
    touristName: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    touristRole: { fontSize: 12, color: '#B0B8C4', fontWeight: '500' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 15 },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateItem: { alignItems: 'center', flex: 1 },
    dateDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
    dateLabel: { color: '#8B98A8', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
    dateValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    messageBtn: { width: '100%', height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    messageBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    toastContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 1000 },
    toastSuccess: { backgroundColor: '#00c853' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '80%', elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#253347' },
});