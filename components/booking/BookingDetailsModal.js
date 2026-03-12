import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingDetailsModal = ({ booking, visible, onClose }) => {
    if (!booking) return null;

    const hasDestination = !!booking.destination_detail;
    const hasAccommodation = !!booking.accommodation_detail;

    const title = hasDestination 
        ? `${booking.destination_detail.name} Tour` 
        : (hasAccommodation ? booking.accommodation_detail.title : 'Custom Tour');

    const heroImage = hasDestination && booking.destination_detail.image
        ? { uri: booking.destination_detail.image }
        : (hasAccommodation && booking.accommodation_detail.photo
            ? { uri: booking.accommodation_detail.photo }
            : (booking.guide_detail?.profile_picture ? { uri: booking.guide_detail.profile_picture } : null)
        );

    const providerName = hasDestination || !hasAccommodation
        ? (booking.guide_detail ? `${booking.guide_detail.first_name} ${booking.guide_detail.last_name}` : booking.agency_detail?.username)
        : booking.accommodation_detail.host_full_name;
        
    const providerRole = hasDestination || !hasAccommodation ? 'Local Guide' : 'Host';

    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'confirmed': return '#22C55E';
            case 'pending_payment': return '#F59E0B';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

// --- FIX: Calculate actual percentage dynamically from database amounts ---
    const total = Number(booking.total_price || 0);
    const downPayment = Number(booking.down_payment || 0);
    const balance = Number(booking.balance_due || 0);
    
    const dpPercent = total > 0 && downPayment > 0 
        ? ((downPayment / total) * 100).toFixed(0) 
        : "30";
        
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const mins = parts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${mins} ${ampm}`;
        }
        return timeStr;
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    
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

                        {booking.meetup_location && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionHeader}>Meetup & Coordination</Text>
                                    <View style={styles.meetupCard}>
                                        <View style={styles.meetupRow}>
                                            <View style={styles.meetupIconBox}><Ionicons name="location" size={18} color="#0072FF" /></View>
                                            <View style={{flex: 1}}>
                                                <Text style={styles.meetupLabel}>Location</Text>
                                                <Text style={styles.meetupValue}>{booking.meetup_location}</Text>
                                            </View>
                                        </View>
                                        
                                        {booking.meetup_time && (
                                            <View style={styles.meetupRow}>
                                                <View style={styles.meetupIconBox}><Ionicons name="time" size={18} color="#0072FF" /></View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.meetupLabel}>Time</Text>
                                                    <Text style={styles.meetupValue}>{formatTime(booking.meetup_time)}</Text>
                                                </View>
                                            </View>
                                        )}
                                        
                                        {booking.meetup_instructions && (
                                            <View style={[styles.meetupRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                                <View style={styles.meetupIconBox}><Ionicons name="information-circle" size={18} color="#0072FF" /></View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.meetupLabel}>Instructions</Text>
                                                    <Text style={styles.meetupValue}>{booking.meetup_instructions}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.priceSection}>
                            <Text style={styles.sectionHeader}>Payment Breakdown</Text>
                            
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Price</Text>
                                <Text style={styles.priceValue}>₱ {total.toLocaleString()}</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={[styles.priceLabel, {color: '#22C55E'}]}>Down Payment Paid ({dpPercent}%)</Text>
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

    meetupCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    meetupRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D1E8FF' },
    meetupIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    meetupLabel: { fontSize: 11, color: '#60A5FA', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    meetupValue: { fontSize: 14, color: '#1E3A8A', fontWeight: '600' },

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