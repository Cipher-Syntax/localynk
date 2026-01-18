import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingDetailsModal = ({ booking, visible, onClose }) => {
    if (!booking) return null;

    const isAccommodation = !!booking.accommodation_detail;
    const title = isAccommodation 
        ? booking.accommodation_detail.title 
        : (booking.destination_detail?.name ? `${booking.destination_detail.name} Tour` : 'Custom Tour');

    // Hero Image Logic
    const heroImage = isAccommodation 
        ? { uri: booking.accommodation_detail.photo } 
        : (booking.destination_detail?.image 
            ? { uri: booking.destination_detail.image } 
            : (booking.guide_detail?.profile_picture ? { uri: booking.guide_detail.profile_picture } : null)
        );

    // Provider Info
    const providerName = isAccommodation 
        ? booking.accommodation_detail.host_full_name 
        : (booking.guide_detail ? `${booking.guide_detail.first_name} ${booking.guide_detail.last_name}` : booking.agency_detail?.username);
    const providerRole = isAccommodation ? 'Host' : 'Local Guide';

    // Status Colors
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'confirmed': return '#22C55E';
            case 'pending_payment': return '#F59E0B';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    // --- Financials ---
    const total = Number(booking.total_price || 0);
    const downPayment = Number(booking.down_payment || 0);
    const balance = Number(booking.balance_due || 0);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    
                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        {heroImage ? (
                            <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.heroImage, styles.placeholderImage]}>
                                <Ionicons name="images-outline" size={50} color="#fff" />
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>{booking.status}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <View style={styles.closeButtonBlur}><Ionicons name="close" size={22} color="#000" /></View>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.bookingId}>Booking ID: #{booking.id}</Text>

                        <View style={styles.divider} />

                        {/* Provider Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Service Provider</Text>
                            <View style={styles.providerRow}>
                                <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{providerName?.charAt(0)}</Text></View>
                                <View>
                                    <Text style={styles.providerName}>{providerName}</Text>
                                    <Text style={styles.providerRole}>{providerRole}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Dates & Guests */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Trip Details</Text>
                            <View style={styles.gridRow}>
                                <View style={styles.gridItem}>
                                    <Text style={styles.label}>Check In</Text>
                                    <Text style={styles.value}>{booking.check_in}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.label}>Check Out</Text>
                                    <Text style={styles.value}>{booking.check_out}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.label}>Guests</Text>
                                    <Text style={styles.value}>{booking.num_guests}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* --- FINANCIAL BREAKDOWN SECTION --- */}
                        <View style={styles.priceSection}>
                            <Text style={styles.sectionHeader}>Payment Breakdown</Text>
                            
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Price</Text>
                                <Text style={styles.priceValue}>₱ {total.toLocaleString()}</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={[styles.priceLabel, {color: '#22C55E'}]}>Down Payment Paid (30%)</Text>
                                <Text style={[styles.priceValue, {color: '#22C55E'}]}>- ₱ {downPayment.toLocaleString()}</Text>
                            </View>

                            <View style={styles.balanceContainer}>
                                <View style={styles.balanceRow}>
                                    <Text style={styles.balanceLabel}>Balance Due</Text>
                                    <Text style={styles.balanceValue}>₱ {balance.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.balanceNote}>
                                    * Payable directly to the {providerRole} upon arrival.
                                </Text>
                            </View>
                        </View>

                        <View style={{height: 30}} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    modalView: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '90%', width: '100%', overflow: 'hidden' },
    imageContainer: { height: 200, width: '100%', position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    placeholderImage: { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
    closeButtonBlur: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 8 },
    statusBadge: { position: 'absolute', bottom: 15, left: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
    
    contentContainer: { padding: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
    bookingId: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
    
    section: { marginBottom: 15 },
    sectionHeader: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
    
    providerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00A8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    providerName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    providerRole: { fontSize: 12, color: '#6B7280' },

    gridRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12 },
    gridItem: { alignItems: 'flex-start' },
    label: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '600' },
    value: { fontSize: 14, color: '#1F2937', fontWeight: '600' },

    priceSection: { marginTop: 0 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 14, color: '#4B5563' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    
    balanceContainer: { marginTop: 10, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 16, fontWeight: '800', color: '#92400E' },
    balanceValue: { fontSize: 18, fontWeight: '800', color: '#92400E' },
    balanceNote: { fontSize: 11, color: '#B45309', marginTop: 6, fontStyle: 'italic' }
});

export default BookingDetailsModal;