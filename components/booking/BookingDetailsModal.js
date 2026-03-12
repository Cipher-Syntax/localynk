import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookingDetailsModal = ({ booking, visible, onClose, allBookings = [] }) => {
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

    const total = Number(booking.total_price || 0);
    const downPayment = Number(booking.down_payment || 0);
    const currentBalanceDue = Number(booking.balance_due || 0);
    
    const originalBalance = total - downPayment;
    const isFullyPaidOnline = originalBalance <= 0;
    const isBalanceReceived = currentBalanceDue === 0 && !isFullyPaidOnline;
    
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

    const isAgencyBooking = !!booking.agency || !!booking.agency_detail;

    const concurrentBookings = useMemo(() => {
        if (!isAgencyBooking || !booking || !allBookings || allBookings.length === 0) return [];
        return allBookings.filter(b => {
            if (b.id === booking.id) return false;
            
            const isSameProvider = (b.agency === booking.agency || b.agency_detail?.id === booking.agency_detail?.id);
                
            if (!isSameProvider) return false;
            
            const bStart = new Date(b.check_in);
            const bEnd = new Date(b.check_out || b.check_in);
            bStart.setHours(0,0,0,0); bEnd.setHours(0,0,0,0);
            
            const selStart = new Date(booking.check_in);
            const selEnd = new Date(booking.check_out || booking.check_in);
            selStart.setHours(0,0,0,0); selEnd.setHours(0,0,0,0);
            
            const overlaps = (bStart <= selEnd && bEnd >= selStart);
            const isConfirmedStatus = ['confirmed', 'completed', 'pending_payment', 'accepted'].includes((b.status || '').toLowerCase());
            
            return overlaps && isConfirmedStatus;
        });
    }, [booking, allBookings, isAgencyBooking]);

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
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]} >
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
                            <Text style={styles.sectionHeader}>Your Guest Roster</Text>
                            
                            <View style={styles.manifestCardOverview}>
                                <View style={styles.manifestHeaderTitle}>
                                    <Ionicons name="people" size={20} color="#0072FF" />
                                    <Text style={styles.manifestHeaderText}>Lead Roster Details</Text>
                                </View>
                                <View style={styles.manifestRowDetail}>
                                    <Text style={styles.manifestLabelDetail}>Lead Guest:</Text>
                                    <Text style={styles.manifestValueDetail}>{booking.tourist_username || "N/A"}</Text>
                                </View>
                                <View style={styles.manifestRowDetail}>
                                    <Text style={styles.manifestLabelDetail}>Total Pax:</Text>
                                    <Text style={styles.manifestValueDetail}>{booking.num_guests} People</Text>
                                </View>
                                
                                {/* --- NEW: DISPLAY ADDITIONAL GUESTS ON ITINERARY --- */}
                                {booking.additional_guest_names && booking.additional_guest_names.length > 0 && (
                                    <View style={[styles.manifestRowDetail, {flexDirection: 'column', alignItems: 'flex-start', marginTop: 4}]}>
                                        <Text style={styles.manifestLabelDetail}>Additional Guests:</Text>
                                        <View style={{marginTop: 4}}>
                                            {booking.additional_guest_names.map((name, idx) => (
                                                <Text key={idx} style={[styles.manifestValueDetail, {fontWeight: '500', color: '#475569', marginBottom: 2}]}>
                                                    • {name || `Guest ${idx + 2}`}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                
                                <View style={[styles.manifestRowDetail, {marginTop: 8}]}>
                                    <Text style={styles.manifestLabelDetail}>Schedule:</Text>
                                    <Text style={styles.manifestValueDetail}>{booking.check_in} to {booking.check_out}</Text>
                                </View>

                                {booking.meetup_location && (
                                    <>
                                        <View style={styles.manifestDivider} />
                                        <View style={styles.manifestHeaderTitle}>
                                            <Ionicons name="navigate" size={20} color="#F59E0B" />
                                            <Text style={[styles.manifestHeaderText, {color: '#B45309'}]}>Pickup & Coordination</Text>
                                        </View>
                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Location:</Text>
                                            <Text style={styles.manifestValueDetail}>{booking.meetup_location}</Text>
                                        </View>
                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Time:</Text>
                                            <Text style={styles.manifestValueDetail}>{formatTime(booking.meetup_time)}</Text>
                                        </View>
                                        {booking.meetup_instructions && (
                                            <View style={[styles.manifestRowDetail, {flexDirection: 'column', alignItems: 'flex-start'}]}>
                                                <Text style={styles.manifestLabelDetail}>Special Instructions:</Text>
                                                <Text style={[styles.manifestValueDetail, {marginTop: 4, fontStyle: 'italic'}]}>{booking.meetup_instructions}</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.priceSection}>
                            <Text style={styles.sectionHeader}>Payment Breakdown & Ledger</Text>
                            
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Trip Price</Text>
                                <Text style={styles.priceValue}>₱ {total.toLocaleString()}</Text>
                            </View>

                            <View style={styles.ledgerContainer}>
                                {booking.downpayment_paid_at && (
                                    <View style={styles.ledgerRow}>
                                        <View style={styles.ledgerTimeline}>
                                            <View style={styles.ledgerDot} />
                                            <View style={styles.ledgerLine} />
                                        </View>
                                        <View style={styles.ledgerContent}>
                                            <Text style={styles.ledgerDate}>
                                                {new Date(booking.downpayment_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Text>
                                            <View style={styles.ledgerDetails}>
                                                <Text style={styles.ledgerDesc}>Down Payment ({dpPercent}%)</Text>
                                                <Text style={styles.ledgerAmount}>₱ {downPayment.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.ledgerRow}>
                                    <View style={styles.ledgerTimeline}>
                                        <View style={[styles.ledgerDot, !isBalanceReceived && !isFullyPaidOnline && { backgroundColor: '#CBD5E1', borderColor: '#94A3B8' }]} />
                                    </View>
                                    <View style={styles.ledgerContent}>
                                        {booking.balance_paid_at && (
                                            <Text style={styles.ledgerDate}>
                                                {new Date(booking.balance_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Text>
                                        )}
                                        <View style={styles.ledgerDetails}>
                                            <Text style={[styles.ledgerDesc, !isBalanceReceived && !isFullyPaidOnline && { color: '#64748B' }]}>
                                                {isFullyPaidOnline ? 'Fully Paid Upfront' : 'Remaining Balance'}
                                            </Text>
                                            <Text style={[styles.ledgerAmount, !isBalanceReceived && !isFullyPaidOnline && { color: '#64748B' }]}>
                                                ₱ {originalBalance.toLocaleString()}
                                            </Text>
                                        </View>
                                        {!isBalanceReceived && !isFullyPaidOnline && (
                                            <Text style={styles.ledgerPendingText}>Pending Collection</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={[
                                styles.balanceContainer, 
                                isBalanceReceived && { backgroundColor: '#DCFCE7', borderLeftColor: '#22C55E' },
                                isFullyPaidOnline && { backgroundColor: '#F3F4F6', borderLeftColor: '#9CA3AF' }
                            ]}>
                                <View style={styles.balanceRow}>
                                    <Text style={[
                                        styles.balanceLabel, 
                                        isBalanceReceived && { color: '#166534' },
                                        isFullyPaidOnline && { color: '#4B5563' }
                                    ]}>
                                        {isFullyPaidOnline ? 'Balance' : (isBalanceReceived ? 'Balance Received' : 'Balance Due')}
                                    </Text>
                                    <Text style={[
                                        styles.balanceValue, 
                                        isBalanceReceived && { color: '#166534' },
                                        isFullyPaidOnline && { color: '#4B5563' }
                                    ]}>
                                        ₱ {isBalanceReceived ? '0.00' : currentBalanceDue.toLocaleString()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.balanceNote, 
                                    isBalanceReceived && { color: '#15803D' },
                                    isFullyPaidOnline && { color: '#6B7280' }
                                ]}>
                                    {isFullyPaidOnline 
                                        ? '* 100% paid online upfront.' 
                                        : (isBalanceReceived 
                                            ? `* Collected face-to-face by the ${providerRole}.` 
                                            : `* Payable directly to the ${providerRole} upon arrival.`
                                        )
                                    }
                                </Text>
                            </View>
                        </View>

                        {isAgencyBooking && (
                            <>
                                <View style={styles.divider} />
                                <View style={{ marginTop: 10, marginBottom: 20 }}>
                                    <Text style={styles.sectionHeader}>Other Bookings on these Dates</Text>
                                    {concurrentBookings.length === 0 ? (
                                        <View style={styles.emptyManifest}>
                                            <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
                                            <Text style={styles.emptyManifestText}>No other tourists scheduled for these dates.</Text>
                                        </View>
                                    ) : (
                                        concurrentBookings.map((b, i) => (
                                            <View key={b.id || i} style={styles.manifestCard}>
                                                <View style={styles.manifestHeader}>
                                                    <Ionicons name="person-circle" size={24} color="#0072FF" />
                                                    <Text style={styles.manifestGuest}>{b.tourist_username || b.tourist_detail?.username || "Guest"}</Text>
                                                    <View style={styles.manifestPaxBadge}>
                                                        <Text style={styles.manifestPaxText}>{b.num_guests} Pax</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.manifestRow}>
                                                    <Text style={styles.manifestLabel}>Dates:</Text>
                                                    <Text style={styles.manifestValue}>{b.check_in} to {b.check_out}</Text>
                                                </View>
                                                {b.meetup_location && (
                                                    <View style={styles.manifestRow}>
                                                        <Text style={styles.manifestLabel}>Pickup:</Text>
                                                        <Text style={styles.manifestValue}>{b.meetup_location}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))
                                    )}
                                </View>
                            </>
                        )}

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

    manifestCardOverview: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    manifestHeaderTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    manifestHeaderText: { fontSize: 14, fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' },
    manifestRowDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    manifestLabelDetail: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    manifestValueDetail: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
    manifestDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },

    priceSection: { marginTop: 0 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    priceLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    priceValue: { fontSize: 15, fontWeight: '800', color: '#1F2937' },

    ledgerContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
    ledgerRow: { flexDirection: 'row', minHeight: 50 },
    ledgerTimeline: { width: 24, alignItems: 'center' },
    ledgerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0072FF', borderWidth: 2, borderColor: '#fff', zIndex: 2 },
    ledgerLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: -2, marginBottom: -2 },
    ledgerContent: { flex: 1, paddingBottom: 20, paddingLeft: 8 },
    ledgerDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    ledgerDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ledgerDesc: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    ledgerAmount: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
    ledgerPendingText: { fontSize: 11, color: '#F59E0B', fontStyle: 'italic', marginTop: 4 },
    
    balanceContainer: { marginTop: 10, padding: 15, backgroundColor: '#FEF3C7', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 16, fontWeight: '800', color: '#92400E' },
    balanceValue: { fontSize: 18, fontWeight: '800', color: '#92400E' },
    balanceNote: { fontSize: 11, color: '#B45309', marginTop: 6, fontStyle: 'italic' },

    manifestCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
    manifestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    manifestGuest: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
    manifestPaxBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    manifestPaxText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12 },
    manifestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    manifestLabel: { fontSize: 13, color: '#64748B', width: 60 },
    manifestValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', flex: 1, textAlign: 'right' },
    emptyManifest: { padding: 30, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', marginTop: 20 },
    emptyManifestText: { color: '#64748B', fontStyle: 'italic', marginTop: 10, fontSize: 13 },
});

export default BookingDetailsModal;