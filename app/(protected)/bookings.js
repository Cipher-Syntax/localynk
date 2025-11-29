import React, { useState, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    StatusBar, 
    TouchableOpacity,
    RefreshControl,
    Image,
    Dimensions,
    Modal,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import BookingDetailsModal from '../../components/booking/BookingDetailsModal';

const { width } = Dimensions.get('window');

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Details Modal State
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // --- TOAST STATE (Matches your snippet) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // --- Confirmation Modal State ---
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [bookingIdToCancel, setBookingIdToCancel] = useState(null);
    
    const { user } = useAuth();

    // --- TOAST LOGIC ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        
        // Fade In
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto Hide after 3 seconds
        setTimeout(() => {
            hideToast();
        }, 3000);
    };

    const hideToast = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setToast(prev => ({ ...prev, show: false }));
        });
    };

    const fetchBookings = async () => {
        try {
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

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchBookings();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, []);

    // --- CANCELLATION LOGIC ---

    const initiateCancellation = (bookingId) => {
        setBookingIdToCancel(bookingId);
        setConfirmVisible(true);
    };

    const confirmCancellation = async () => {
        setConfirmVisible(false);
        if (!bookingIdToCancel) return;

        try {
            await api.delete(`/api/bookings/${bookingIdToCancel}/`);
            
            // Optimistic Update
            setBookings(prevBookings => 
                prevBookings.map(b => 
                    b.id === bookingIdToCancel ? { ...b, status: 'cancelled' } : b
                )
            );
            
            showToast("Booking cancelled successfully!", "success");
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            showToast("Could not cancel the booking.", "error");
        } finally {
            setBookingIdToCancel(null);
        }
    };

    const handleOpenModal = (booking) => {
        setSelectedBooking(booking);
        setDetailsModalVisible(true);
    };

    const handleCloseModal = () => {
        setDetailsModalVisible(false);
        setSelectedBooking(null);
    };

    // --- HELPER LOGIC ---
    const getStatusStyle = (status) => {
        const normalizedStatus = String(status || '').toLowerCase();
        switch (normalizedStatus) {
            case 'accepted': return { badge: styles.acceptedBadge, text: styles.acceptedText, icon: 'checkmark-circle' };
            case 'pending': return { badge: styles.pendingBadge, text: styles.pendingText, icon: 'time' };
            case 'declined':
            case 'cancelled': return { badge: styles.declinedBadge, text: styles.declinedText, icon: 'close-circle' };
            case 'paid': 
            case 'completed': return { badge: styles.acceptedBadge, text: styles.acceptedText, icon: 'checkmark-done-circle' };
            default: return { badge: styles.defaultBadge, text: styles.defaultText, icon: 'help-circle' };
        }
    };

    const getProviderName = (item) => {
        if (item.guide_detail) {
            const firstName = item.guide_detail.first_name || '';
            const lastName = item.guide_detail.last_name || '';
            return `${firstName} ${lastName}`.trim() || item.guide_detail.username || "Unknown Guide";
        } else if (item.agency_detail) {
            return item.agency_detail.username || "Agency";
        } else if (item.accommodation_detail) {
             return item.accommodation_detail.host_full_name || item.accommodation_detail.host_username || "Host";
        }
        return "N/A";
    };

    // --- RENDER ITEMS ---

    const renderHeader = () => (
        <View style={styles.header}>
            <Image
                source={require('../../assets/localynk_images/header.png')}
                style={styles.headerImage}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                style={styles.overlay}
            />
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>MY BOOKINGS</Text>
                <Text style={styles.headerSubtitle}>Manage your upcoming adventures</Text>
            </View>
        </View>
    );

    const renderBookingItem = ({ item }) => {
        const { badge, text, icon } = getStatusStyle(item.status);
        const canCancel = item.status.toLowerCase() === 'pending';
        const providerName = getProviderName(item);

        const bookingType = item.accommodation_detail 
            ? 'Accommodation Stay' 
            : (item.destination_detail?.name ? 'Guided Tour' : 'Tour');

        const locationName = item.destination_detail?.name || item.accommodation_detail?.location || 'Location N/A';
        const titleName = item.accommodation_detail?.title || item.destination_detail?.name || 'Custom Booking';

        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => handleOpenModal(item)}
                style={styles.cardContainer}
            >
                <View style={styles.bookingCard}>
                    <View style={[styles.statusStrip, badge]} />

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={{flex: 1}}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{titleName}</Text>
                                <Text style={styles.cardType}>{bookingType}</Text>
                            </View>
                            <View style={[styles.statusBadge, badge]}>
                                <Ionicons name={icon} size={12} color={text.color} style={{marginRight: 4}} />
                                <Text style={text}>{item.status}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <Ionicons name="location-sharp" size={16} color="#3B82F6" style={styles.iconWidth} />
                                <Text style={styles.detailText} numberOfLines={1}>{locationName}</Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar" size={16} color="#3B82F6" style={styles.iconWidth} />
                                <Text style={styles.detailText}>{item.check_in || 'Date N/A'}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="person" size={16} color="#3B82F6" style={styles.iconWidth} />
                                <Text style={styles.detailText}>Provider: {providerName}</Text>
                            </View>
                        </View>

                        {canCancel && (
                            <View style={styles.cardFooter}>
                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={() => initiateCancellation(item.id)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" />
            
            <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No bookings found.</Text>
                        <Text style={styles.emptySubText}>Explore destinations to start your journey!</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={["#00A8FF"]} 
                        progressViewOffset={140}
                    />
                }
            />

            <BookingDetailsModal 
                booking={selectedBooking} 
                visible={detailsModalVisible} 
                onClose={handleCloseModal} 
            />

            {/* --- CONFIRMATION MODAL --- */}
            <Modal
                transparent={true}
                visible={confirmVisible}
                animationType="fade"
                onRequestClose={() => setConfirmVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModalBox}>
                        <View style={styles.confirmIconBg}>
                            <Ionicons name="alert" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.confirmTitle}>Cancel Booking?</Text>
                        <Text style={styles.confirmDesc}>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </Text>
                        <View style={styles.confirmBtnRow}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnCancel]} 
                                onPress={() => setConfirmVisible(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>Keep it</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnConfirm]} 
                                onPress={confirmCancellation}
                            >
                                <Text style={styles.modalBtnTextConfirm}>Yes, Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {toast.show && (
                <Animated.View style={[
                    styles.toastContainer, 
                    { opacity: fadeAnim },
                    toast.type === 'success' ? styles.toastSuccess : styles.toastError
                ]}>
                    <View style={styles.toastContent}>
                        <Ionicons 
                            name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                            size={24} 
                            color="white" 
                        />
                        <Text style={styles.toastText}>{toast.message}</Text>
                    </View>
                    
                    <TouchableOpacity onPress={hideToast} style={styles.toastCloseBtn}>
                        <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </Animated.View>
            )}

        </SafeAreaView>
    );
};

export default MyBookings;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },

    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        marginBottom: 30
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
    headerContent: {
        position: 'absolute',
        bottom: 10,
        left: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        color: '#f0f0f0',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },

    // --- Card Styles ---
    cardContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    bookingCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 2,
    },
    cardType: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    
    // Details
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginBottom: 12,
    },
    detailsContainer: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWidth: {
        width: 24,
    },
    detailText: {
        fontSize: 14,
        color: '#4b5563',
        flex: 1,
    },

    // Footer
    cardFooter: {
        marginTop: 16,
        alignItems: 'flex-end',
    },
    cancelButton: {
        backgroundColor: '#fee2e2',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '700',
    },

    // --- Status Badges ---
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    acceptedBadge: { backgroundColor: '#dcfce7' }, 
    acceptedText: { color: '#16a34a', fontWeight: '700', fontSize: 11 },
    
    pendingBadge: { backgroundColor: '#fef9c3' }, 
    pendingText: { color: '#ca8a04', fontWeight: '700', fontSize: 11 },
    
    declinedBadge: { backgroundColor: '#fee2e2' }, 
    declinedText: { color: '#dc2626', fontWeight: '700', fontSize: 11 },
    
    defaultBadge: { backgroundColor: '#f3f4f6' }, 
    defaultText: { color: '#6b7280', fontWeight: '700', fontSize: 11 },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },

    // --- TOAST NOTIFICATION STYLES ---
    toastContainer: {
        position: 'absolute',
        top: 50, // Display at the top like the web snippet
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 2000,
        width: '90%',
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    toastSuccess: { 
        backgroundColor: '#1E293B', // Dark slate bg like snippet
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.5)', // Green border
    }, 
    toastError: { 
        backgroundColor: '#1E293B', // Dark slate bg
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.5)', // Red border
    },
    toastText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 12,
        fontSize: 14,
        flex: 1, // Allow text to wrap if needed
    },
    toastCloseBtn: {
        padding: 4,
        marginLeft: 8,
    },

    // --- Confirmation Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalBox: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmIconBg: {
        width: 60,
        height: 60,
        backgroundColor: '#FEF2F2',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    confirmDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmBtnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: '#F3F4F6',
    },
    modalBtnTextCancel: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16,
    },
    modalBtnConfirm: {
        backgroundColor: '#EF4444',
    },
    modalBtnTextConfirm: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});