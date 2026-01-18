import React, { useState, useCallback, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar, 
    TouchableOpacity, RefreshControl, Image, Dimensions, Modal, Animated, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import BookingDetailsModal from '../../components/booking/BookingDetailsModal';

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal & Action States
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    // Cancellation State
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [bookingIdToCancel, setBookingIdToCancel] = useState(null);

    // --- Toast Logic ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => hideToast(), 3000);
    };
    const hideToast = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, show: false })));
    };

    // --- Fetch Bookings (ALL) ---
    const fetchBookings = async () => {
        try {
            // No params = fetch ALL bookings related to me (Guide OR Tourist)
            const response = await api.get('/api/bookings/');
            setBookings(response.data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            showToast("Failed to fetch bookings.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { setLoading(true); fetchBookings(); }, []));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchBookings(); }, []);

    // --- ACTION: Cancel Booking (For Tourist) ---
    const initiateCancellation = (bookingId) => {
        setBookingIdToCancel(bookingId);
        setConfirmVisible(true);
    };

    const confirmCancellation = async () => {
        setConfirmVisible(false);
        if (!bookingIdToCancel) return;

        try {
            await api.patch(`/api/bookings/${bookingIdToCancel}/status/`, { status: 'Cancelled' });
            setBookings(prev => prev.map(b => b.id === bookingIdToCancel ? { ...b, status: 'Cancelled' } : b));
            showToast("Booking cancelled successfully.", "success");
        } catch (error) {
            console.error('Failed to cancel:', error);
            showToast("Could not cancel. Try again.", "error");
        } finally {
            setBookingIdToCancel(null);
        }
    };

    // --- ACTION: Mark as Paid (For Guide) ---
    const markAsPaid = async (bookingId) => {
        Alert.alert(
            "Confirm Payment",
            "Has the tourist paid the remaining balance? This will mark the trip as Completed.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Yes, Payment Received", 
                    onPress: async () => {
                        try {
                            const res = await api.post(`/api/bookings/${bookingId}/mark_paid/`);
                            // Update local state
                            setBookings(prev => prev.map(b => 
                                b.id === bookingId ? { ...b, status: 'Completed', balance_due: 0 } : b
                            ));
                            showToast("Booking marked as Paid & Completed!", "success");
                        } catch (error) {
                            console.error("Mark paid failed", error);
                            showToast("Failed to update booking.", "error");
                        }
                    }
                }
            ]
        );
    };

    const handleOpenModal = (booking) => { setSelectedBooking(booking); setDetailsModalVisible(true); };
    const handleCloseModal = () => { setDetailsModalVisible(false); setSelectedBooking(null); };

    const getStatusStyle = (status) => {
        const normalized = String(status || '').toLowerCase();
        switch (normalized) {
            case 'confirmed': 
            case 'completed': 
                return { badge: styles.acceptedBadge, text: styles.acceptedText, icon: 'checkmark-circle' };
            case 'pending_payment': 
                return { badge: styles.pendingBadge, text: styles.pendingText, icon: 'time' };
            case 'cancelled': 
            case 'declined': 
                return { badge: styles.declinedBadge, text: styles.declinedText, icon: 'close-circle' };
            default: 
                return { badge: styles.defaultBadge, text: styles.defaultText, icon: 'help-circle' };
        }
    };

    const renderBookingItem = ({ item }) => {
        const { badge, text, icon } = getStatusStyle(item.status);
        
        // --- 1. DETERMINE ROLE ---
        const isMyTrip = item.tourist_id === user?.id; // I am the Tourist
        const isMyClient = !isMyTrip; // I am the Guide/Host

        // --- 2. CALCULATE FINANCIALS ---
        const total = Number(item.total_price || 0);
        const down = Number(item.down_payment || 0);
        // Calculate commission to display to guide
        const commission = total * 0.02; 
        const netPayout = down - commission;

        // --- 3. DETERMINE ACTIONS ---
        const canCancel = isMyTrip && ['confirmed', 'pending_payment'].includes(item.status.toLowerCase());
        const canMarkPaid = isMyClient && item.status === 'Confirmed';

        const titleName = item.accommodation_detail?.title || item.destination_detail?.name || 'Custom Booking';
        const typeLabel = item.accommodation_detail ? 'Stay' : 'Tour';
        
        let otherPartyName = "Unknown";
        if (isMyTrip) {
            if (item.guide_detail) otherPartyName = `Guide: ${item.guide_detail.first_name} ${item.guide_detail.last_name}`;
            else if (item.agency_detail) otherPartyName = `Agency: ${item.agency_detail.username}`;
            else if (item.accommodation_detail) otherPartyName = `Host: ${item.accommodation_detail.host_full_name}`;
        } else {
            otherPartyName = `Tourist: ${item.tourist_username || "Guest"}`;
        }

        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleOpenModal(item)} style={styles.cardContainer}>
                <View style={styles.bookingCard}>
                    {/* Color Strip: Blue for My Trips, Orange for Client Bookings */}
                    <View style={[styles.statusStrip, { backgroundColor: isMyTrip ? '#00A8FF' : '#FF9F43' }]} />
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={{flex: 1}}>
                                {/* Label Tag */}
                                <View style={[styles.roleTag, { backgroundColor: isMyTrip ? '#E0F2FE' : '#FFF3E0' }]}>
                                    <Text style={[styles.roleTagText, { color: isMyTrip ? '#0072FF' : '#FF9F43' }]}>
                                        {isMyTrip ? "MY TRIP" : "CLIENT BOOKING"}
                                    </Text>
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={1}>{titleName}</Text>
                                <Text style={styles.cardType}>{typeLabel} • {otherPartyName}</Text>
                            </View>
                            <View style={[styles.statusBadge, badge]}>
                                <Ionicons name={icon} size={12} color={text.color} style={{marginRight: 4}} />
                                <Text style={text}>{item.status}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar" size={16} color="#3B82F6" style={styles.iconWidth} />
                                <Text style={styles.detailText}>
                                    {item.check_in} {item.check_out ? `— ${item.check_out}` : ''}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="wallet" size={16} color={item.balance_due > 0 ? "#F59E0B" : "#22C55E"} style={styles.iconWidth} />
                                <Text style={[styles.detailText, { fontWeight: '600', color: item.balance_due > 0 ? '#B45309' : '#15803D' }]}>
                                    {item.balance_due > 0 ? `Collect Balance: ₱${Number(item.balance_due).toLocaleString()}` : "Fully Paid"}
                                </Text>
                            </View>
                            
                            {/* --- GUIDE FINANCIAL BREAKDOWN (The new part) --- */}
                            {isMyClient && (
                                <View style={styles.financialBox}>
                                    <Text style={styles.finHeader}>PAYOUT BREAKDOWN</Text>
                                    
                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Total Price</Text>
                                        <Text style={styles.finValue}>₱{total.toLocaleString()}</Text>
                                    </View>
                                    
                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Down Payment (Paid Online)</Text>
                                        <Text style={styles.finValue}>₱{down.toLocaleString()}</Text>
                                    </View>

                                    <View style={styles.finRow}>
                                        <Text style={[styles.finLabel, {color: '#EF4444'}]}>Less: App Commission (2%)</Text>
                                        <Text style={[styles.finValue, {color: '#EF4444'}]}>- ₱{commission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                                    </View>

                                    <View style={styles.finDivider} />

                                    <View style={styles.finRow}>
                                        <Text style={[styles.finLabel, {fontWeight:'700', color:'#059669'}]}>Net Payout (Incoming via Admin)</Text>
                                        <Text style={[styles.finValue, {fontWeight:'800', color:'#059669'}]}>₱{netPayout.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* --- ACTION BUTTONS --- */}
                        <View style={styles.cardFooter}>
                            {canCancel && (
                                <TouchableOpacity style={styles.cancelButton} onPress={() => initiateCancellation(item.id)}>
                                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                </TouchableOpacity>
                            )}

                            {canMarkPaid && (
                                <TouchableOpacity style={styles.paidButton} onPress={() => markAsPaid(item.id)}>
                                    <Ionicons name="checkmark-done-circle" size={16} color="#fff" style={{marginRight:6}} />
                                    <Text style={styles.paidButtonText}>Confirm Balance Received</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00A8FF" /></View>;

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" />
            <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>BOOKINGS MANAGER</Text>
                            <Text style={styles.headerSubtitle}>Your Trips & Client Requests</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No bookings found.</Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A8FF"]} />}
            />

            <BookingDetailsModal booking={selectedBooking} visible={detailsModalVisible} onClose={handleCloseModal} />

            <Modal transparent={true} visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModalBox}>
                        <View style={styles.confirmIconBg}><Ionicons name="alert" size={32} color="#EF4444" /></View>
                        <Text style={styles.confirmTitle}>Cancel Booking?</Text>
                        <Text style={styles.confirmDesc}>Are you sure? You might lose your down payment based on the refund policy.</Text>
                        <View style={styles.confirmBtnRow}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setConfirmVisible(false)}>
                                <Text style={styles.modalBtnTextCancel}>Keep it</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={confirmCancellation}>
                                <Text style={styles.modalBtnTextConfirm}>Yes, Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {toast.show && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
                    <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

export default MyBookings;

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { position: 'relative', height: 120, justifyContent: 'center', marginBottom: 20 },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerContent: { position: 'absolute', bottom: 15, left: 20 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    headerSubtitle: { color: '#e0e0e0', fontSize: 13 },
    listContainer: { paddingBottom: 40 },
    
    cardContainer: { paddingHorizontal: 16, marginBottom: 16 },
    bookingCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3, overflow: 'hidden' },
    statusStrip: { width: 6, height: '100%' },
    cardContent: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    
    roleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    roleTagText: { fontSize: 10, fontWeight: '800' },
    
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    cardType: { fontSize: 12, color: '#6B7280' },
    statusBadge: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center', height: 26 },
    
    acceptedBadge: { backgroundColor: '#DCFCE7' }, 
    acceptedText: { color: '#166534', fontSize: 11, fontWeight: '700' },
    pendingBadge: { backgroundColor: '#FEF9C3' }, 
    pendingText: { color: '#854D0E', fontSize: 11, fontWeight: '700' },
    declinedBadge: { backgroundColor: '#FEE2E2' }, 
    declinedText: { color: '#991B1B', fontSize: 11, fontWeight: '700' },
    defaultBadge: { backgroundColor: '#F3F4F6' },
    defaultText: { color: '#4B5563', fontSize: 11 },
    
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    detailsContainer: { gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWidth: { width: 16, textAlign: 'center' },
    detailText: { fontSize: 13, color: '#4B5563' },
    
    // --- FINANCIAL BREAKDOWN STYLES ---
    financialBox: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#BBF7D0' },
    finHeader: { fontSize: 10, fontWeight: '800', color: '#15803D', marginBottom: 8, letterSpacing: 0.5, textTransform:'uppercase' },
    finRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    finLabel: { fontSize: 12, color: '#374151' },
    finValue: { fontSize: 12, fontWeight: '600', color: '#111827' },
    finDivider: { height: 1, backgroundColor: '#DCFCE7', marginVertical: 6 },

    cardFooter: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelButton: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
    cancelButtonText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
    
    paidButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#22C55E', borderRadius: 8, shadowColor: "#22C55E", shadowOpacity: 0.3, elevation: 3 },
    paidButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 10 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    confirmModalBox: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
    confirmIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    confirmTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    confirmDesc: { textAlign: 'center', color: '#6B7280', marginBottom: 20 },
    confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: '#F3F4F6' },
    modalBtnConfirm: { backgroundColor: '#DC2626' },
    modalBtnTextCancel: { fontWeight: '600', color: '#374151' },
    modalBtnTextConfirm: { fontWeight: '600', color: '#fff' },
    
    toastContainer: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: '#1F2937', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, width: '90%', shadowOpacity: 0.2, elevation: 5 },
    toastSuccess: { borderLeftWidth: 4, borderLeftColor: '#22C55E' },
    toastError: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
    toastText: { color: '#fff', marginLeft: 10, fontWeight: '600' }
});