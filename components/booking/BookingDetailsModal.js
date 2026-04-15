import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPHPhoneLocal } from '../../utils/phoneNumber';
import { buildPricingBreakdown } from '../../utils/pricingBreakdown';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import StopDetailsModal from '../itinerary/StopDetailsModal';
import JourneyTrackingModal from './JourneyTrackingModal';
import CompactMapCard from '../location/CompactMapCard';

const BookingDetailsModal = ({ booking, visible, onClose, allBookings = [], onBookingUpdated }) => {
    // Always call hooks before any early return
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);
    const [journeyVisible, setJourneyVisible] = useState(false);
    const [journeyHasChanges, setJourneyHasChanges] = useState(false);
    const { user } = useAuth();

    // Provide default values to avoid calling hooks conditionally
    const hasDestination = !!booking?.destination_detail;
    const hasAccommodation = !!booking?.accommodation_detail;

    const title = hasDestination 
        ? `${booking?.destination_detail?.name} Tour` 
        : (hasAccommodation ? booking?.accommodation_detail?.title : 'Custom Tour');

    const heroImage = hasDestination && booking?.destination_detail?.image
        ? { uri: booking.destination_detail.image }
        : (hasAccommodation && booking?.accommodation_detail?.photo
            ? { uri: booking.accommodation_detail.photo }
            : (booking?.guide_detail?.profile_picture 
                ? { uri: booking.guide_detail.profile_picture } 
                : (booking?.agency_detail?.logo 
                    ? { uri: booking.agency_detail.logo } 
                    : (booking?.agency_detail?.profile_picture ? { uri: booking.agency_detail.profile_picture } : null))
              )
        );

    const providerName = hasDestination || !hasAccommodation
        ? (booking?.guide_detail ? `${booking.guide_detail.first_name} ${booking.guide_detail.last_name}` : (booking?.agency_detail?.business_name || booking?.agency_detail?.username))
        : booking?.accommodation_detail?.host_full_name;
        
    const providerRole = hasDestination || !hasAccommodation 
        ? (booking?.guide_detail ? 'Local Guide' : 'Travel Agency') 
        : 'Host';

    const providerImage = hasDestination || !hasAccommodation
        ? (booking?.guide_detail?.profile_picture || booking?.agency_detail?.logo || booking?.agency_detail?.profile_picture)
        : null;

    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'confirmed': return '#22C55E';
            case 'pending_payment': return '#F59E0B';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const total = Number(booking?.total_price || 0);
    const downPayment = Number(booking?.down_payment || 0);
    const currentBalanceDue = Number(booking?.balance_due || 0);

    const pricingBreakdown = useMemo(() => {
        return buildPricingBreakdown({
            totalPrice: total,
            startDate: booking?.check_in,
            endDate: booking?.check_out,
            packageDurationDays: booking?.tour_package_detail?.duration_days,
            numberOfPeople: booking?.num_guests,
            groupType: Number(booking?.num_guests) > 1 ? 'group' : 'solo',
            soloPricePerDay: booking?.tour_package_detail?.solo_price,
            groupPricePerDay: booking?.tour_package_detail?.price_per_day,
            extraPersonFeePerHead: booking?.tour_package_detail?.additional_fee_per_head,
            accommodationCostPerNight: booking?.accommodation_detail?.price,
            packageDetail: booking?.tour_package_detail,
            accommodationDetail: booking?.accommodation_detail,
        });
    }, [booking, total]);
    
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

        if (diffDays === 0) return String(checkIn);
        return `${checkIn} to ${checkOut}`;
    };

    const isAgencyBooking = !!booking?.agency || !!booking?.agency_detail;

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

    const assignedGuides = Array.isArray(booking?.assigned_agency_guides_detail) 
        ? booking.assigned_agency_guides_detail 
        : (booking?.assigned_agency_guides_detail ? [booking.assigned_agency_guides_detail] : []);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        const raw = String(imgPath).trim();
        if (!raw) return null;
        if (raw.startsWith('http') || raw.startsWith('file://') || raw.startsWith('data:')) return raw;

        const base = (api.defaults.baseURL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
        if (raw.startsWith('/')) return `${base}${raw}`;
        return `${base}/${raw.replace(/^\/+/, '')}`;
    };

    const tourItineraryTimeline = useMemo(() => {
        let timeline = booking?.tour_package_detail?.itinerary_timeline;

        if (typeof timeline === 'string') {
            try {
                timeline = JSON.parse(timeline);
            } catch (_e) {
                timeline = [];
            }
        }

        return Array.isArray(timeline) ? timeline : [];
    }, [booking]);

    const tourItineraryByDay = useMemo(() => {
        if (tourItineraryTimeline.length === 0) return null;

        return tourItineraryTimeline.reduce((acc, stop) => {
            const dayNum = Number.parseInt(stop?.day, 10) || 1;
            if (!acc[dayNum]) acc[dayNum] = [];
            acc[dayNum].push(stop);
            return acc;
        }, {});
    }, [tourItineraryTimeline]);

    const viewerId = Number(user?.id || 0);
    const assignedGuideIds = useMemo(() => {
        const ids = new Set();

        if (Array.isArray(booking?.assigned_guides)) {
            booking.assigned_guides.forEach((value) => {
                const normalized = Number(value);
                if (Number.isFinite(normalized) && normalized > 0) ids.add(normalized);
            });
        }

        if (Array.isArray(booking?.assigned_guides_detail)) {
            booking.assigned_guides_detail.forEach((guide) => {
                const normalized = Number(guide?.id);
                if (Number.isFinite(normalized) && normalized > 0) ids.add(normalized);
            });
        }

        return ids;
    }, [booking]);

    const isTouristViewer = viewerId > 0 && Number(booking?.tourist_id) === viewerId;
    const isProviderViewer = viewerId > 0 && (
        Number(booking?.guide) === viewerId ||
        Number(booking?.guide_detail?.id) === viewerId ||
        Number(booking?.agency) === viewerId ||
        Number(booking?.agency_detail?.id) === viewerId ||
        Number(booking?.accommodation_detail?.host_id) === viewerId ||
        assignedGuideIds.has(viewerId)
    );
    const isAdminViewer = Boolean(user?.is_staff || user?.is_superuser);
    const canAccessJourneyTracker = viewerId > 0 && (isTouristViewer || isProviderViewer || isAdminViewer);
    const canEditGuideRemarks = isProviderViewer || isAdminViewer;
    const canEditTouristRemarks = isTouristViewer || isAdminViewer;

    const handleJourneyClose = () => {
        setJourneyVisible(false);
        if (journeyHasChanges) {
            setJourneyHasChanges(false);
            if (typeof onBookingUpdated === 'function' && booking?.id) {
                onBookingUpdated(booking.id);
            }
        }
    };

    if (!booking) return null;

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
                                {providerImage ? (
                                    <Image source={{ uri: providerImage }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{providerName?.charAt(0)}</Text></View>
                                )}
                                
                                <View>
                                    <Text style={styles.providerName}>{providerName}</Text>
                                    <Text style={styles.providerRole}>{providerRole}</Text>
                                </View>
                            </View>
                        </View>

                        {hasAccommodation && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Accommodation</Text>
                                <View style={styles.manifestCardOverview}>
                                    <View style={styles.manifestRowDetail}>
                                        <Text style={styles.manifestLabelDetail}>Name:</Text>
                                        <Text style={styles.manifestValueDetail}>{booking.accommodation_detail?.title || booking.accommodation_detail?.name || 'N/A'}</Text>
                                    </View>
                                    {!!booking.accommodation_detail?.location && (
                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Location:</Text>
                                            <Text style={styles.manifestValueDetail}>{booking.accommodation_detail.location}</Text>
                                        </View>
                                    )}
                                    <CompactMapCard
                                        latitude={booking.accommodation_detail?.latitude}
                                        longitude={booking.accommodation_detail?.longitude}
                                        title="Accommodation Location"
                                        subtitle={booking.accommodation_detail?.location || ''}
                                    />
                                    {!!booking.accommodation_detail?.price && (
                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Rate:</Text>
                                            <Text style={styles.manifestValueDetail}>₱ {Number(booking.accommodation_detail.price).toLocaleString()}/day</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {isAgencyBooking && assignedGuides.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Assigned Tour Guide/s</Text>
                                {assignedGuides.map((guide, idx) => {
                                    const gFullName = guide.full_name || "Assigned Guide";
                                    const gPhone = guide.contact_number ? formatPHPhoneLocal(guide.contact_number) : "N/A";
                                    const gEmail = guide.email || "N/A";
                                    
                                    const rawSpecialty = guide.specializations || guide.specialization;
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
                                    <Text style={styles.manifestLabelDetail}>Contact Number:</Text>
                                    <Text style={[styles.manifestValueDetail, {textTransform: 'none'}]}>
                                        {booking.tourist_detail?.phone_number || booking.tourist_detail?.phone_number || "N/A"}
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

                                {/* --- START: BOX LAYOUT FOR VERIFICATION DOCUMENTS --- */}
                                {(booking.tourist_valid_id_image || booking?.tourist_detail?.valid_id_image || booking.tourist_selfie_image) && (
                                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }}>
                                        <Text style={[styles.manifestLabelDetail, { marginBottom: 8, color: '#1E3A8A', fontWeight: '700' }]}>Verification Documents:</Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            
                                            {/* ID Box */}
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '600' }}>Valid ID</Text>
                                                {(booking.tourist_valid_id_image || booking?.tourist_detail?.valid_id_image) ? (
                                                    <Image
                                                        source={{ uri: getImageUrl(booking.tourist_valid_id_image || booking?.tourist_detail?.valid_id_image) }}
                                                        style={{ width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' }}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={{ width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                                                        <Ionicons name="card-outline" size={24} color="#CBD5E1" />
                                                        <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>No ID</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Selfie Box */}
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: '600' }}>Selfie</Text>
                                                {booking.tourist_selfie_image ? (
                                                    <Image
                                                        source={{ uri: getImageUrl(booking.tourist_selfie_image) }}
                                                        style={{ width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' }}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={{ width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                                                        <Ionicons name="person-outline" size={24} color="#CBD5E1" />
                                                        <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>No Selfie</Text>
                                                    </View>
                                                )}
                                            </View>

                                        </View>
                                    </View>
                                )}
                                {/* --- END: VERIFICATION DOCUMENTS --- */}

                                {booking.meetup_location && (
                                    <>
                                        <View style={styles.manifestDivider} />
                                        <View style={styles.manifestHeaderTitle}>
                                            <Ionicons name="navigate" size={20} color="#F59E0B" />
                                            <Text style={[styles.manifestHeaderText, {color: '#B45309'}]}>Pickup & Coordination</Text>
                                        </View>

                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Date:</Text>
                                            <Text style={styles.manifestValueDetail}>
                                                {booking.check_in ? new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </Text>
                                        </View>

                                        <View style={styles.manifestRowDetail}>
                                            <Text style={styles.manifestLabelDetail}>Location:</Text>
                                            <Text style={styles.manifestValueDetail}>{booking.meetup_location}</Text>
                                        </View>
                                        <CompactMapCard
                                            latitude={booking.meetup_latitude}
                                            longitude={booking.meetup_longitude}
                                            title="Meetup Point"
                                            subtitle={booking.meetup_location || ''}
                                        />
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

                        {(hasDestination || !!booking?.tour_package_detail) && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={[styles.sectionHeader, { marginBottom: 0 }]}>Booked Itinerary Schedule</Text>
                                    {tourItineraryTimeline.length > 0 && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.viewStopDetailsButton}
                                                onPress={() => setStopDetailsVisible(true)}
                                            >
                                                <Ionicons name="images-outline" size={14} color="#1D4ED8" />
                                                <Text style={styles.viewStopDetailsText}>View Stop Details</Text>
                                            </TouchableOpacity>

                                            {canAccessJourneyTracker && (
                                                <TouchableOpacity
                                                    style={styles.trackJourneyButton}
                                                    onPress={() => setJourneyVisible(true)}
                                                >
                                                    <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                                                    <Text style={styles.trackJourneyText}>Track Journey</Text>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    )}
                                </View>
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

                                {pricingBreakdown.hasBreakdownItems && (
                                    <>
                                        <View style={styles.summarySubRow}>
                                            <Text style={styles.summarySubLabel}>
                                                Package ({pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''} x ₱ {pricingBreakdown.packageRatePerDay.toLocaleString()}/day)
                                            </Text>
                                            <Text style={styles.summarySubValue}>₱ {pricingBreakdown.packageSubtotal.toLocaleString()}</Text>
                                        </View>

                                        {pricingBreakdown.extraGuests > 0 && pricingBreakdown.extraGuestSubtotal > 0 && (
                                            <View style={styles.summarySubRow}>
                                                <Text style={styles.summarySubLabel}>
                                                    Extra guests ({pricingBreakdown.extraGuests} x ₱ {pricingBreakdown.extraFeePerHead.toLocaleString()} x {pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''})
                                                </Text>
                                                <Text style={styles.summarySubValue}>₱ {pricingBreakdown.extraGuestSubtotal.toLocaleString()}</Text>
                                            </View>
                                        )}

                                        {pricingBreakdown.accommodationSubtotal > 0 && (
                                            <View style={styles.summarySubRow}>
                                                <Text style={styles.summarySubLabel}>
                                                    Accommodation ({pricingBreakdown.nights} night{pricingBreakdown.nights > 1 ? 's' : ''} x ₱ {pricingBreakdown.accommodationRatePerNight.toLocaleString()}/night)
                                                </Text>
                                                <Text style={styles.summarySubValue}>₱ {pricingBreakdown.accommodationSubtotal.toLocaleString()}</Text>
                                            </View>
                                        )}

                                        {pricingBreakdown.hasAdjustment && (
                                            <View style={styles.summarySubRow}>
                                                <Text style={styles.summarySubLabel}>Adjustment</Text>
                                                <Text style={styles.summarySubValue}>
                                                    {pricingBreakdown.adjustmentAmount >= 0 ? '₱ ' : '- ₱ '}
                                                    {Math.abs(pricingBreakdown.adjustmentAmount).toLocaleString()}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                                
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

            <StopDetailsModal
                visible={stopDetailsVisible}
                onClose={() => setStopDetailsVisible(false)}
                timeline={tourItineraryTimeline}
                stopCatalog={Array.isArray(booking?.tour_package_detail?.stops) ? booking.tour_package_detail.stops : []}
                accommodationCatalog={booking?.accommodation_detail ? [booking.accommodation_detail] : []}
                getImageUrl={getImageUrl}
            />

            <JourneyTrackingModal
                visible={journeyVisible}
                bookingId={booking?.id}
                canEditChecklist={canAccessJourneyTracker}
                canEditGuideRemarks={canEditGuideRemarks}
                canEditTouristRemarks={canEditTouristRemarks}
                onJourneyUpdated={() => setJourneyHasChanges(true)}
                onClose={handleJourneyClose}
            />
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
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
    viewStopDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    viewStopDetailsText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
    trackJourneyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1D4ED8',
        borderWidth: 1,
        borderColor: '#1D4ED8',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    trackJourneyText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
    
    providerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
    avatarImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12, resizeMode: 'cover' },
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
    summarySubRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 2 },
    summarySubLabel: { flex: 1, marginRight: 10, fontSize: 12, color: '#64748B', fontWeight: '500' },
    summarySubValue: { fontSize: 12, color: '#1E293B', fontWeight: '600' },
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