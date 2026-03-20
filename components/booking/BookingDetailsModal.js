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

    const getBookingDateDisplay = (checkIn, checkOut) => {
        if (!checkIn) return '';
        if (!checkOut) return String(checkIn);

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return `${checkIn} to ${checkOut}`;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

        // FIXED: Only hide the end date if the start and end are on the exact same day.
        if (diffDays === 0) return String(checkIn);
        return `${checkIn} to ${checkOut}`;
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

    const assignedGuides = Array.isArray(booking.assigned_agency_guides_detail) 
        ? booking.assigned_agency_guides_detail 
        : (booking.assigned_agency_guides_detail ? [booking.assigned_agency_guides_detail] : []);

    const tourItineraryByDay = useMemo(() => {
        let timeline = booking?.tour_package_detail?.itinerary_timeline;
        
        if (typeof timeline === 'string') {
            try {
                timeline = JSON.parse(timeline);
            } catch (e) {
                timeline = [];
            }
        }

        if (!Array.isArray(timeline) || timeline.length === 0) return null;

        return timeline.reduce((acc, stop) => {
            const dayNum = Number.parseInt(stop?.day, 10) || 1;
            if (!acc[dayNum]) acc[dayNum] = [];
            acc[dayNum].push(stop);
            return acc;
        }, {});
    }, [booking]);

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

                        {/* --- ASSIGNED AGENCY GUIDES SECTION --- */}
                        {isAgencyBooking && assignedGuides.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Assigned Tour Guide/s</Text>
                                {assignedGuides.map((guide, idx) => {
                                    const gFullName = guide.full_name || "Assigned Guide";
                                    const gPhone = guide.contact_number || "N/A";
                                    const gEmail = guide.email || "N/A";
                                    
                                    const rawSpecialty = guide.specialization;
                                    const gSpecialty = Array.isArray(rawSpecialty) ? rawSpecialty.join(', ') : (rawSpecialty || "General Tour");
                                    
                                    const rawLanguages = guide.languages;
                                    const gLanguages = Array.isArray(rawLanguages) ? rawLanguages.join(', ') : (rawLanguages || "English");

                                    return (
                                        <View key={idx} style={[styles.manifestCardOverview, {marginBottom: 10, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF'}]}>
                                            <View style={styles.manifestHeaderTitle}>
                                                <Ionicons name="id-card" size={20} color="#0072FF" />
                                                <Text style={styles.manifestHeaderText}>{gFullName}</Text>
                                            </View>
                                            
                                            <View style={styles.manifestRowDetail}>
                                                <Text style={styles.manifestLabelDetail}>Specialty:</Text>
                                                <Text style={styles.manifestValueDetail}>{gSpecialty}</Text>
                                            </View>

                                            <View style={styles.manifestRowDetail}>
                                                <Text style={styles.manifestLabelDetail}>Languages:</Text>
                                                <Text style={styles.manifestValueDetail}>{gLanguages}</Text>
                                            </View>

                                            <View style={[styles.manifestDivider, {borderColor: '#93C5FD'}]} />

                                            <View style={styles.manifestRowDetail}>
                                                <Text style={styles.manifestLabelDetail}>Contact Number:</Text>
                                                <Text style={styles.manifestValueDetail}>{gPhone}</Text>
                                            </View>

                                            <View style={styles.manifestRowDetail}>
                                                <Text style={styles.manifestLabelDetail}>Email Address:</Text>
                                                <Text style={[styles.manifestValueDetail, {textTransform: 'none'}]}>{gEmail}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

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
                                    <Text style={styles.manifestLabelDetail}>Contact Email:</Text>
                                    <Text style={[styles.manifestValueDetail, {textTransform: 'none'}]}>
                                        {booking.tourist_email || booking.tourist_detail?.email || "N/A"}
                                    </Text>
                                </View>

                                <View style={styles.manifestRowDetail}>
                                    <Text style={styles.manifestLabelDetail}>Total Pax:</Text>
                                    <Text style={styles.manifestValueDetail}>{booking.num_guests} People</Text>
                                </View>
                                
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
                                    <Text style={styles.manifestValueDetail}>{getBookingDateDisplay(booking.check_in, booking.check_out)}</Text>
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

                        {/* EXPLICITLY HIDDEN FOR AGENCIES: Render Itinerary ONLY if not an agency booking */}
                        {(!isAgencyBooking && (hasDestination || !!booking?.tour_package_detail)) && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Booked Itinerary Schedule</Text>
                                {!!tourItineraryByDay ? (
                                    Object.keys(tourItineraryByDay)
                                        .sort((a, b) => Number(a) - Number(b))
                                        .map((dayKey) => (
                                            <View key={`day-${dayKey}`} style={styles.itineraryDayBlock}>
                                                <Text style={styles.itineraryDayTitle}>Day {dayKey}</Text>
                                                {tourItineraryByDay[dayKey].map((stop, idx) => (
                                                    <View key={`stop-${dayKey}-${idx}`} style={styles.itineraryStopItem}>
                                                        <View style={styles.itineraryStopDot} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.itineraryStopName}>{stop?.activityName || stop?.name || 'Activity Stop'}</Text>
                                                            {!!stop?.startTime && (
                                                                <Text style={styles.itineraryStopMeta}>
                                                                    {stop.startTime}{stop?.endTime ? ` - ${stop.endTime}` : ''}
                                                                </Text>
                                                            )}
                                                            {!!stop?.type && <Text style={styles.itineraryStopMeta}>{String(stop.type)}</Text>}
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ))
                                ) : (
                                    <View style={styles.itineraryEmptyBox}>
                                        <Text style={styles.itineraryEmptyText}>
                                            No itinerary is linked to this booking yet.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* --- PAYMENT SUMMARY --- */}
                        <View style={styles.priceSection}>
                            <Text style={styles.sectionHeader}>Payment Summary</Text>
                            
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Trip Price</Text>
                                    <Text style={styles.summaryValue}>₱ {total.toLocaleString()}</Text>
                                </View>
                                
                                <View style={styles.summaryRow}>
                                    <View>
                                        <Text style={styles.summaryLabel}>Down Payment ({dpPercent}%)</Text>
                                        {booking.downpayment_paid_at && (
                                            <Text style={styles.summaryDate}>
                                                Paid {new Date(booking.downpayment_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.summaryValue}>₱ {downPayment.toLocaleString()}</Text>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={[
                                    styles.balanceHighlight,
                                    isBalanceReceived && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                                    isFullyPaidOnline && { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
                                    !isBalanceReceived && !isFullyPaidOnline && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }
                                ]}>
                                    <View style={styles.balanceHighlightRow}>
                                        <View>
                                            <Text style={[
                                                styles.balanceHighlightLabel,
                                                isBalanceReceived && { color: '#166534' },
                                                isFullyPaidOnline && { color: '#4B5563' },
                                                !isBalanceReceived && !isFullyPaidOnline && { color: '#92400E' }
                                            ]}>
                                                {isFullyPaidOnline ? 'Balance' : (isBalanceReceived ? 'Balance Received' : 'Balance Due')}
                                            </Text>
                                            {isBalanceReceived && (
                                                <Text style={{ fontSize: 12, color: '#15803D', marginTop: 2, fontWeight: '700' }}>
                                                    On {booking.balance_paid_at 
                                                        ? new Date(booking.balance_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.balanceHighlightValue,
                                            isBalanceReceived && { color: '#166534' },
                                            isFullyPaidOnline && { color: '#4B5563' },
                                            !isBalanceReceived && !isFullyPaidOnline && { color: '#92400E' }
                                        ]}>
                                            ₱ {isFullyPaidOnline ? '0.00' : (isBalanceReceived ? originalBalance.toLocaleString() : currentBalanceDue.toLocaleString())}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.balanceNote,
                                        isBalanceReceived && { color: '#15803D' },
                                        isFullyPaidOnline && { color: '#6B7280' },
                                        !isBalanceReceived && !isFullyPaidOnline && { color: '#B45309' }
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
                                                    <Text style={styles.manifestValue}>{getBookingDateDisplay(b.check_in, b.check_out)}</Text>
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
    itineraryDayBlock: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
    },
    itineraryDayTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1D4ED8',
        marginBottom: 8,
    },
    itineraryStopItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    itineraryStopDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
        marginTop: 6,
    },
    itineraryStopName: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '700',
    },
    itineraryStopMeta: {
        marginTop: 2,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    itineraryEmptyBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    itineraryEmptyText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    manifestDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },

    priceSection: { marginTop: 0 },
    
    summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
    summaryValue: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
    summaryDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
    
    balanceHighlight: { marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1 },
    balanceHighlightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceHighlightLabel: { fontSize: 16, fontWeight: '800' },
    balanceHighlightValue: { fontSize: 18, fontWeight: '800' },
    balanceNote: { fontSize: 11, marginTop: 6, fontStyle: 'italic' },

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