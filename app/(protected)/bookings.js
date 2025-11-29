import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    StatusBar, 
    TouchableOpacity,
    Alert,
    RefreshControl,
    Image,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Make sure to install this
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
    
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    
    const { user } = useAuth();

    const fetchBookings = async () => {
        try {
            const response = await api.get('/api/bookings/');
            setBookings(response.data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            Alert.alert("Error", "Failed to fetch bookings. Please try again.");
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

    const handleCancelBooking = async (bookingId) => {
        Alert.alert(
            "Confirm Cancellation",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    onPress: async () => {
                        try {
                            await api.delete(`/api/bookings/${bookingId}/`);
                            Alert.alert("Success", "Booking cancelled successfully.");
                            setBookings(prevBookings => 
                                prevBookings.map(b => 
                                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                                )
                            );
                        } catch (error) {
                            console.error('Failed to cancel booking:', error);
                            Alert.alert("Error", "Could not cancel the booking. Please try again.");
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleOpenModal = (booking) => {
        setSelectedBooking(booking);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedBooking(null);
    };

    // --- Helper Logic (Same as before) ---
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

    // --- Render Items ---

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Image
                source={require('../../assets/localynk_images/header.png')} // Matches your reference
                style={styles.headerImage}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
                style={styles.headerOverlay}
            />
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>MY BOOKINGS</Text>
                <Text style={styles.headerSubtitle}>Manage your upcoming adventures</Text>
            </View>
        </View>
    );

    const renderBookingItem = ({ item }) => {
        const { badge, text, icon } = getStatusStyle(item.status);
        const canCancel = item.status.toLowerCase() === 'pending' || item.status.toLowerCase() === 'accepted';
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
                    {/* Status Strip on Left */}
                    <View style={[styles.statusStrip, badge]} />

                    <View style={styles.cardContent}>
                        {/* Header: Title & Status */}
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

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Details */}
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

                        {/* Action Footer */}
                        {canCancel && (
                            <View style={styles.cardFooter}>
                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={() => handleCancelBooking(item.id)}
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
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
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
                        progressViewOffset={140} // Pushes the spinner down below the header
                    />
                }
            />

            <BookingDetailsModal 
                booking={selectedBooking} 
                visible={modalVisible} 
                onClose={handleCloseModal} 
            />
        </SafeAreaView>
    );
};

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

    // --- Header Styles (Matches Reference) ---
    headerContainer: {
        height: 180, // Slightly taller for better visual
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 10,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        position: 'absolute',
        bottom: 30,
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
        marginTop: 20
    },
    bookingCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        // Shadow
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
        width: 24, // Ensures text aligns perfectly even if icon changes
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
    acceptedBadge: { backgroundColor: '#dcfce7' }, // Light Green
    acceptedText: { color: '#16a34a', fontWeight: '700', fontSize: 11 },
    
    pendingBadge: { backgroundColor: '#fef9c3' }, // Light Yellow
    pendingText: { color: '#ca8a04', fontWeight: '700', fontSize: 11 },
    
    declinedBadge: { backgroundColor: '#fee2e2' }, // Light Red
    declinedText: { color: '#dc2626', fontWeight: '700', fontSize: 11 },
    
    defaultBadge: { backgroundColor: '#f3f4f6' }, // Grey
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
});

export default MyBookings;