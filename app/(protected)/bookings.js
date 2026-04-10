import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Animated, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import BookingDetailsModal from '../../components/booking/BookingDetailsModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
    getBookingSortTimestamp,
    getLatestBookingTimestamp,
    setSeenBookingTimestamp,
    getSeenBookingTabTimestamp,
    setSeenBookingTabTimestamp,
} from '../../utils/bookingNotifications';
import { buildPricingBreakdown } from '../../utils/pricingBreakdown';
import ScreenSafeArea from '../../components/ScreenSafeArea';

const REFUND_MIN_DAYS_BEFORE_CHECKIN = 3;

const MyBookings = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [bookingIdToCancel, setBookingIdToCancel] = useState(null);
    
    const [paidConfirmVisible, setPaidConfirmVisible] = useState(false);
    const [bookingIdToMarkPaid, setBookingIdToMarkPaid] = useState(null);
    const [activeTab, setActiveTab] = useState('my_trip');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [destinationSearch, setDestinationSearch] = useState('');
    const [destinationModalVisible, setDestinationModalVisible] = useState(false);
    const [selectedDestinationGroup, setSelectedDestinationGroup] = useState(null);
    const [modalStatusFilter, setModalStatusFilter] = useState('all');
    const [modalDateFilter, setModalDateFilter] = useState('all');
    const [modalSearchFilter, setModalSearchFilter] = useState('');

    // --- NEW: State for Tab Notification Dots ---
    const [hasNewMyTrip, setHasNewMyTrip] = useState(false);
    const [hasNewClientBooking, setHasNewClientBooking] = useState(false);
    const [latestMyTripTs, setLatestMyTripTs] = useState(0);
    const [latestClientBookingTs, setLatestClientBookingTs] = useState(0);
    const activeTabRef = useRef('my_trip');

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => hideToast(), 3000);
    };

    const hideToast = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(prev => ({ ...prev, show: false })));
    };

    const fetchBookings = useCallback(async () => {
        try {
            const response = await api.get('/api/bookings/');
            const incoming = Array.isArray(response.data) ? response.data : [];
            const sorted = [...incoming].sort((a, b) => getBookingSortTimestamp(b) - getBookingSortTimestamp(a));
            setBookings(sorted);

            if (user?.id) {
                // Separate bookings to check unseen status independently
                const myTrips = sorted.filter(b => b.tourist_id === user.id);
                const clientBookings = sorted.filter(b => b.tourist_id !== user.id);

                const latestMyTs = getLatestBookingTimestamp(myTrips);
                const latestClientTs = getLatestBookingTimestamp(clientBookings);
                setLatestMyTripTs(latestMyTs);
                setLatestClientBookingTs(latestClientTs);

                const seenMyTs = await getSeenBookingTabTimestamp(user.id, 'my_trip');
                const seenClientTs = await getSeenBookingTabTimestamp(user.id, 'client_booking');

                let unseenMyTrips = latestMyTs > seenMyTs;
                let unseenClientBookings = latestClientTs > seenClientTs;

                // Opening a tab is what marks that tab as seen.
                const currentTab = activeTabRef.current;
                if (currentTab === 'my_trip' && unseenMyTrips && latestMyTs > 0) {
                    await setSeenBookingTabTimestamp(user.id, 'my_trip', latestMyTs);
                    unseenMyTrips = false;
                }
                if (currentTab === 'client_booking' && unseenClientBookings && latestClientTs > 0) {
                    await setSeenBookingTabTimestamp(user.id, 'client_booking', latestClientTs);
                    unseenClientBookings = false;
                }

                setHasNewMyTrip(unseenMyTrips);
                setHasNewClientBooking(unseenClientBookings);

                // Keep global booking badge aligned only when both tab queues were seen.
                const latestTs = getLatestBookingTimestamp(sorted);
                if (!unseenMyTrips && !unseenClientBookings && latestTs > 0) {
                    await setSeenBookingTimestamp(user.id, latestTs);
                }
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(useCallback(() => { setLoading(true); fetchBookings(); }, [fetchBookings]));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchBookings(); }, [fetchBookings]);

    // Handle switching tabs and clearing the dot for that tab
    const switchTab = async (tab) => {
        setActiveTab(tab);
        activeTabRef.current = tab;

        if (!user?.id) return;

        let nextHasNewMyTrip = hasNewMyTrip;
        let nextHasNewClientBooking = hasNewClientBooking;

        if (tab === 'my_trip') {
            if (latestMyTripTs > 0) {
                await setSeenBookingTabTimestamp(user.id, 'my_trip', latestMyTripTs);
            }
            nextHasNewMyTrip = false;
            setHasNewMyTrip(false);
        }

        if (tab === 'client_booking') {
            if (latestClientBookingTs > 0) {
                await setSeenBookingTabTimestamp(user.id, 'client_booking', latestClientBookingTs);
            }
            nextHasNewClientBooking = false;
            setHasNewClientBooking(false);
        }

        const latestTs = getLatestBookingTimestamp(bookings);
        if (!nextHasNewMyTrip && !nextHasNewClientBooking && latestTs > 0) {
            await setSeenBookingTimestamp(user.id, latestTs);
        }
    };

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
            
            if (selectedDestinationGroup) {
                setSelectedDestinationGroup(prev => ({
                    ...prev,
                    bookings: prev.bookings.map(b => b.id === bookingIdToCancel ? { ...b, status: 'Cancelled' } : b)
                }));
            }
            
            if (selectedBooking && selectedBooking.id === bookingIdToCancel) {
                setSelectedBooking(prev => ({ ...prev, status: 'Cancelled' }));
            }

            showToast("Booking cancelled successfully.", "success");
            
            fetchBookings();
        } catch (error) {
            console.error('Failed to cancel:', error);
            showToast("Could not cancel. Try again.", "error");
        } finally {
            setBookingIdToCancel(null);
        }
    };

    const initiateMarkAsPaid = (bookingId) => {
        setBookingIdToMarkPaid(bookingId);
        setPaidConfirmVisible(true);
    };

    const confirmMarkAsPaid = async () => {
        setPaidConfirmVisible(false);
        if (!bookingIdToMarkPaid) return;
        
        try {
            await api.post(`/api/bookings/${bookingIdToMarkPaid}/mark_paid/`);
            
            const updates = { status: 'Completed', balance_due: 0, balance_paid_at: new Date().toISOString() };
            
            setBookings(prev => prev.map(b => b.id === bookingIdToMarkPaid ? { ...b, ...updates } : b));
            
            if (selectedDestinationGroup) {
                setSelectedDestinationGroup(prev => ({
                    ...prev,
                    bookings: prev.bookings.map(b => b.id === bookingIdToMarkPaid ? { ...b, ...updates } : b)
                }));
            }
            
            if (selectedBooking && selectedBooking.id === bookingIdToMarkPaid) {
                setSelectedBooking(prev => ({ ...prev, ...updates }));
            }

            showToast("Booking marked as Paid & Completed!", "success");
            fetchBookings();
        } catch (error) {
            console.error("Mark paid failed", error);
            showToast("Failed to update booking.", "error");
        } finally {
            setBookingIdToMarkPaid(null);
        }
    };

    const handleOpenModal = (booking) => { setSelectedBooking(booking); setDetailsModalVisible(true); };
    const handleCloseModal = () => { setDetailsModalVisible(false); setSelectedBooking(null); };

    const handleProceedToPayment = (booking) => {
        if (!booking?.id) return;

        const isAgencyBooking = !!(booking.agency || booking.agency_detail);
        const guideName = `${booking?.guide_detail?.first_name || ''} ${booking?.guide_detail?.last_name || ''}`.trim();
        const entityName = isAgencyBooking
            ? (booking?.agency_detail?.business_name || booking?.agency_detail?.username || 'Selected Agency')
            : (booking?.guide_detail?.full_name || guideName || booking?.guide_detail?.username || 'Selected Guide');

        router.push({
            pathname: '/(protected)/payment',
            params: {
                bookingId: String(booking.id),
                bookingType: isAgencyBooking ? 'agency' : 'guide',
                entityId: String(booking.agency || booking.guide || ''),
                entityName,
                placeId: booking.destination ? String(booking.destination) : '',
                placeName: booking?.destination_detail?.name || '',
                agencyId: booking?.accommodation_detail?.agency_id ? String(booking.accommodation_detail.agency_id) : '',
                agencyLogo: booking?.agency_detail?.logo || booking?.agency_detail?.profile_picture || '',
            },
        });
    };

    const handleOpenMessage = (booking) => {
        const partnerId = Number(booking?.agency || booking?.guide || booking?.agency_detail?.id || booking?.guide_detail?.id);
        if (!Number.isFinite(partnerId) || partnerId <= 0) {
            showToast('Unable to open chat for this booking.', 'error');
            return;
        }

        const guideName = `${booking?.guide_detail?.first_name || ''} ${booking?.guide_detail?.last_name || ''}`.trim();
        const partnerName = booking?.agency
            ? (booking?.agency_detail?.business_name || booking?.agency_detail?.username || 'Agency')
            : (booking?.guide_detail?.full_name || guideName || booking?.guide_detail?.username || 'Tour Guide');

        const partnerImage = booking?.agency
            ? (booking?.agency_detail?.logo || booking?.agency_detail?.profile_picture || '')
            : (booking?.guide_detail?.profile_picture || '');

        router.push({
            pathname: '/(protected)/message',
            params: {
                partnerId: String(partnerId),
                partnerName,
                partnerImage,
            },
        });
    };

    const handleOpenRefundRequest = (booking) => {
        if (!booking?.id) return;

        router.push({
            pathname: '/(protected)/refundRequest',
            params: {
                bookingId: String(booking.id),
                bookingTitle: getBookingTitle(booking),
                downPayment: String(booking.down_payment || 0),
                checkInDate: String(booking.check_in || ''),
                refundMinDays: String(REFUND_MIN_DAYS_BEFORE_CHECKIN),
            },
        });
    };

    const isMyTripBooking = useCallback((booking) => booking.tourist_id === user?.id, [user?.id]);

    const getBookingTitle = useCallback((booking) => {
        return booking.destination_detail?.name || booking.accommodation_detail?.title || 'Custom Booking';
    }, []);

    const matchesDatePreset = useCallback((booking, preset) => {
        if (preset === 'all') return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(booking.check_in);
        checkInDate.setHours(0, 0, 0, 0);
        if (preset === 'upcoming') return checkInDate >= today;
        if (preset === 'past') return checkInDate < today;
        return true;
    }, []);

    const tabBookings = useMemo(() => {
        return bookings.filter((booking) => {
            const mine = isMyTripBooking(booking);
            return activeTab === 'my_trip' ? mine : !mine;
        });
    }, [bookings, activeTab, isMyTripBooking]);

    const filteredBookings = useMemo(() => {
        return tabBookings.filter((booking) => {
            const normalizedStatus = String(booking.status || '').toLowerCase();
            const statusPass = statusFilter === 'all' ? true : normalizedStatus === statusFilter;
            const datePass = matchesDatePreset(booking, dateFilter);
            return statusPass && datePass;
        });
    }, [tabBookings, statusFilter, dateFilter, matchesDatePreset]);

    const groupedBookings = useMemo(() => {
        const groupedMap = filteredBookings.reduce((acc, booking) => {
            const title = getBookingTitle(booking);
            const key = String(title).trim().toLowerCase();
            if (!acc[key]) {
                acc[key] = {
                    key,
                    title,
                    bookings: [],
                };
            }
            acc[key].bookings.push(booking);
            return acc;
        }, {});

        const groups = Object.values(groupedMap)
            .map((group) => {
                const sortedBookings = [...group.bookings].sort((a, b) => {
                    const aPending = String(a.status || '').toLowerCase() === 'pending_payment';
                    const bPending = String(b.status || '').toLowerCase() === 'pending_payment';
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    
                    return getBookingSortTimestamp(b) - getBookingSortTimestamp(a);
                });
                const latestBooking = sortedBookings[0] || null;

                return {
                    ...group,
                    bookings: sortedBookings,
                    latestBooking,
                    latestTimestamp: latestBooking ? getBookingSortTimestamp(latestBooking) : 0,
                    hasPending: sortedBookings.some(b => String(b.status || '').toLowerCase() === 'pending_payment')
                };
            })
            .sort((a, b) => {
                if (a.hasPending && !b.hasPending) return -1;
                if (!a.hasPending && b.hasPending) return 1;

                if (b.latestTimestamp !== a.latestTimestamp) return b.latestTimestamp - a.latestTimestamp;
                return a.title.localeCompare(b.title);
            });

        const normalizedSearch = destinationSearch.trim().toLowerCase();
        if (!normalizedSearch) return groups;

        return groups.filter((group) => String(group.title).toLowerCase().includes(normalizedSearch));
    }, [filteredBookings, getBookingTitle, destinationSearch]);

    const openDestinationModal = (group) => {
        setSelectedDestinationGroup(group);
        setModalStatusFilter('all');
        setModalDateFilter('all');
        setModalSearchFilter('');
        setDestinationModalVisible(true);
    };

    const closeDestinationModal = () => {
        setDestinationModalVisible(false);
        setSelectedDestinationGroup(null);
        setModalStatusFilter('all');
        setModalDateFilter('all');
        setModalSearchFilter('');
    };

    const modalFilteredBookings = useMemo(() => {
        const source = selectedDestinationGroup?.bookings || [];
        const normalizedSearch = modalSearchFilter.trim().toLowerCase();

        return source.filter((booking) => {
            const normalizedStatus = String(booking.status || '').toLowerCase();
            const title = String(getBookingTitle(booking)).toLowerCase();
            const touristName = String(booking.tourist_username || '').toLowerCase();

            const statusPass = modalStatusFilter === 'all' ? true : normalizedStatus === modalStatusFilter;
            const datePass = matchesDatePreset(booking, modalDateFilter);
            const textPass = !normalizedSearch || title.includes(normalizedSearch) || touristName.includes(normalizedSearch);

            return statusPass && datePass && textPass;
        }).sort((a, b) => {
            const aPending = String(a.status || '').toLowerCase() === 'pending_payment';
            const bPending = String(b.status || '').toLowerCase() === 'pending_payment';
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;

            return getBookingSortTimestamp(b) - getBookingSortTimestamp(a);
        });
    }, [selectedDestinationGroup, modalSearchFilter, modalStatusFilter, modalDateFilter, matchesDatePreset, getBookingTitle]);

    const getStatusStyle = (status) => {
        const normalized = String(status || '').toLowerCase();
        switch (normalized) {
            case 'confirmed': 
            case 'completed': 
                return { badge: styles.acceptedBadge, text: styles.acceptedText, icon: 'checkmark-circle' };
            case 'pending_payment': 
                return { badge: styles.pendingBadge, text: styles.pendingText, icon: 'time' };
            case 'refunded':
                return { badge: styles.refundedBadge, text: styles.refundedText, icon: 'return-down-back' };
            case 'cancelled': 
            case 'declined': 
                return { badge: styles.declinedBadge, text: styles.declinedText, icon: 'close-circle' };
            default: 
                return { badge: styles.defaultBadge, text: styles.defaultText, icon: 'help-circle' };
        }
    };

    const getBookingDateDisplay = (checkIn, checkOut) => {
        if (!checkIn) return '';
        if (!checkOut) return String(checkIn);

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return `${checkIn} — ${checkOut}`;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return String(checkIn);
        return `${checkIn} — ${checkOut}`;
    };

    const getDestinationGroupImageSource = (group) => {
        if (!group?.bookings?.length) return null;
        const firstWithDestination = group.bookings.find((booking) => booking?.destination_detail);
        const firstWithAccommodation = group.bookings.find((booking) => booking?.accommodation_detail);

        const destinationImage = firstWithDestination?.destination_detail?.image
            || firstWithDestination?.destination_detail?.images?.[0]?.image;
        if (destinationImage) return { uri: destinationImage };

        const accommodationImage = firstWithAccommodation?.accommodation_detail?.photo;
        if (accommodationImage) return { uri: accommodationImage };

        return null;
    };

    const renderBookingItem = (item) => {
        const { badge, text, icon } = getStatusStyle(item.status);
        
        const isMyTrip = item.tourist_id === user?.id; 
        const isMyClient = !isMyTrip; 

        const total = Number(item.total_price || 0);
        const down = Number(item.down_payment || 0);
        const commission = item.platform_fee ? Number(item.platform_fee) : (total * 0.02); 
        
        let netPayout = item.guide_payout_amount ? Number(item.guide_payout_amount) : (item.agency_payout_amount ? Number(item.agency_payout_amount) : 0);
        if (netPayout === 0 && down > 0) {
            netPayout = down - commission;
        }

        const currentBalanceDue = Number(item.balance_due || 0);
        const originalBalance = total - down;

        const pricingBreakdown = buildPricingBreakdown({
            totalPrice: total,
            startDate: item.check_in,
            endDate: item.check_out,
            packageDurationDays: item?.tour_package_detail?.duration_days,
            numberOfPeople: item.num_guests,
            groupType: Number(item.num_guests) > 1 ? 'group' : 'solo',
            soloPricePerDay: item?.tour_package_detail?.solo_price,
            groupPricePerDay: item?.tour_package_detail?.price_per_day,
            extraPersonFeePerHead: item?.tour_package_detail?.additional_fee_per_head,
            accommodationCostPerNight: item?.accommodation_detail?.price,
            packageDetail: item?.tour_package_detail,
            accommodationDetail: item?.accommodation_detail,
        });

        const normalizedStatus = String(item.status || '').toLowerCase();
        const refundState = String(item?.refund_status || 'none').toLowerCase();
        const hasOpenRefund = ['requested', 'under_review', 'approved'].includes(refundState);
        const isRefundCompleted = refundState === 'completed' || normalizedStatus === 'refunded';
        const refundStateLabel =
            refundState === 'requested'
                ? 'Refund Requested'
                : refundState === 'under_review'
                    ? 'Refund Under Review'
                    : refundState === 'approved'
                        ? 'Refund Approved'
                        : isRefundCompleted
                            ? 'Refunded'
                            : '';
        
        let balanceDisplayColor = '#B45309'; 
        let balanceIconColor = '#F59E0B'; 
        let balanceText = `Collect Balance: ₱${currentBalanceDue.toLocaleString()}`;

        if (originalBalance <= 0) {
            balanceText = "100% Paid Online";
            balanceDisplayColor = '#4B5563';
            balanceIconColor = '#6B7280';
        } else if (currentBalanceDue === 0) {
            balanceText = `Balance Received: ₱${originalBalance.toLocaleString()}`;
            balanceDisplayColor = '#15803D';
            balanceIconColor = '#22C55E';
        }

        if (isMyClient && hasOpenRefund) {
            balanceText = `Payout Locked: ${refundStateLabel}`;
            balanceDisplayColor = '#1D4ED8';
            balanceIconColor = '#2563EB';
        } else if (isMyClient && isRefundCompleted) {
            balanceText = 'Payout Closed: Refunded';
            balanceDisplayColor = '#0F766E';
            balanceIconColor = '#14B8A6';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(item.check_in);
        checkInDate.setHours(0, 0, 0, 0);
        const hasTripStartedOrPassed = today >= checkInDate;
        const daysUntilCheckIn = Number.isNaN(checkInDate.getTime())
            ? null
            : Math.round((checkInDate - today) / (1000 * 60 * 60 * 24));

        const canCancel = isMyTrip 
            ? ['confirmed', 'pending_payment'].includes(normalizedStatus) && !hasTripStartedOrPassed
            : false;
        
        const assignedGuidesRaw = item?.assigned_agency_guides_detail;
        const assignedGuides = Array.isArray(assignedGuidesRaw)
            ? assignedGuidesRaw
            : (assignedGuidesRaw ? [assignedGuidesRaw] : []);
        const assignedGuideIds = Array.isArray(item?.assigned_agency_guides)
            ? item.assigned_agency_guides
            : [];
        const hasAssignedAgencyGuide = assignedGuides.length > 0 || assignedGuideIds.length > 0;

        const isAgencyPartner = !!item?.agency;
        const canMarkPaid = isMyClient && normalizedStatus === 'confirmed' && currentBalanceDue > 0 && !hasOpenRefund && !isRefundCompleted;
        const canReview = isMyTrip && normalizedStatus === 'completed'; 
        const canProceedToPayment =
            isMyTrip
            && ['accepted', 'pending_payment'].includes(normalizedStatus)
            && currentBalanceDue > 0
            && (!isAgencyPartner || hasAssignedAgencyGuide);
        const canMessageProvider = isMyTrip && Number(item?.agency || item?.guide || 0) > 0;

        const hasPaidDownPayment = Boolean(item?.downpayment_paid_at) || normalizedStatus === 'confirmed';
        const hasRefundableWorkflowStatus = ['accepted', 'confirmed'].includes(normalizedStatus);
        const meetsAgencyRefundRequirements = !isAgencyPartner || hasAssignedAgencyGuide;
        const refundPrerequisitesMet =
            isMyTrip
            && Number(item.down_payment || 0) > 0
            && hasPaidDownPayment
            && hasRefundableWorkflowStatus
            && meetsAgencyRefundRequirements
            && !['completed', 'refunded', 'declined', 'cancelled'].includes(normalizedStatus);

        const canRequestRefund =
            refundPrerequisitesMet
            && (daysUntilCheckIn === null || daysUntilCheckIn >= REFUND_MIN_DAYS_BEFORE_CHECKIN);
        const showRefundWindowHint = refundPrerequisitesMet;
        const refundWindowClosed = showRefundWindowHint && daysUntilCheckIn !== null && daysUntilCheckIn < REFUND_MIN_DAYS_BEFORE_CHECKIN;

        const titleName = getBookingTitle(item);
        const typeLabel = item.destination_detail ? 'Tour' : (item.accommodation_detail ? 'Stay' : 'Tour');
        
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
                    <View style={[styles.statusStrip, { backgroundColor: isMyTrip ? '#00A8FF' : '#FF9F43' }]} />
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={{flex: 1}}>
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
                                    {getBookingDateDisplay(item.check_in, item.check_out)}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="wallet" size={16} color={balanceIconColor} style={styles.iconWidth} />
                                <Text style={[styles.detailText, { fontWeight: '600', color: balanceDisplayColor }]}>
                                    {balanceText}
                                </Text>
                            </View>
                            
                            {isMyClient && (
                                <View style={styles.financialBox}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                        <Text style={styles.finHeader}>PAYOUT BREAKDOWN</Text>
                                        <Text style={{fontSize: 10, color: '#059669', fontWeight: '700', fontStyle: 'italic'}}>{item.is_payout_settled ? "Paid" : "Pending"}</Text>
                                    </View>
                                    
                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Total Price</Text>
                                        <Text style={styles.finValue}>₱{total.toLocaleString()}</Text>
                                    </View>

                                    {pricingBreakdown.hasBreakdownItems && (
                                        <>
                                            <View style={styles.finSubRow}>
                                                <Text style={styles.finSubLabel}>
                                                    Package ({pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''} x ₱{pricingBreakdown.packageRatePerDay.toLocaleString()}/day)
                                                </Text>
                                                <Text style={styles.finSubValue}>₱{pricingBreakdown.packageSubtotal.toLocaleString()}</Text>
                                            </View>

                                            {pricingBreakdown.extraGuests > 0 && pricingBreakdown.extraGuestSubtotal > 0 && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>
                                                        Extra guests ({pricingBreakdown.extraGuests} x ₱{pricingBreakdown.extraFeePerHead.toLocaleString()} x {pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''})
                                                    </Text>
                                                    <Text style={styles.finSubValue}>₱{pricingBreakdown.extraGuestSubtotal.toLocaleString()}</Text>
                                                </View>
                                            )}

                                            {pricingBreakdown.accommodationSubtotal > 0 && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>
                                                        Accommodation ({pricingBreakdown.nights} night{pricingBreakdown.nights > 1 ? 's' : ''} x ₱{pricingBreakdown.accommodationRatePerNight.toLocaleString()}/night)
                                                    </Text>
                                                    <Text style={styles.finSubValue}>₱{pricingBreakdown.accommodationSubtotal.toLocaleString()}</Text>
                                                </View>
                                            )}

                                            {pricingBreakdown.hasAdjustment && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>Adjustment</Text>
                                                    <Text style={styles.finSubValue}>
                                                        {pricingBreakdown.adjustmentAmount >= 0 ? '₱' : '- ₱'}
                                                        {Math.abs(pricingBreakdown.adjustmentAmount).toLocaleString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </>
                                    )}
                                    
                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Down Payment (Paid Online)</Text>
                                        <Text style={styles.finValue}>₱{down.toLocaleString()}</Text>
                                    </View>

                                    <View style={styles.finRow}>
                                        <Text style={[styles.finLabel, {color: '#EF4444'}]}>Less: App Fee (2%)</Text>
                                        <Text style={[styles.finValue, {color: '#EF4444'}]}>- ₱{commission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                                    </View>

                                    <View style={styles.finDivider} />

                                    <View style={styles.finRow}>
                                        <Text style={[styles.finLabel, {fontWeight:'700', color:'#059669'}]}>Net Payout ({item.is_payout_settled ? 'Received' : 'Incoming'})</Text>
                                        <Text style={[styles.finValue, {fontWeight:'800', color:'#059669'}]}>₱{netPayout.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                                    </View>
                                </View>
                            )}

                            {isMyTrip && (
                                <View style={styles.financialBoxTourist}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                                        <Text style={styles.finHeaderTourist}>PAYMENT BREAKDOWN</Text>
                                        <Text style={{fontSize: 10, color: '#1D4ED8', fontWeight: '700', fontStyle: 'italic'}}>
                                            {currentBalanceDue > 0 ? 'Balance Pending' : 'Paid'}
                                        </Text>
                                    </View>

                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Total Price</Text>
                                        <Text style={styles.finValue}>₱{total.toLocaleString()}</Text>
                                    </View>

                                    {pricingBreakdown.hasBreakdownItems && (
                                        <>
                                            <View style={styles.finSubRow}>
                                                <Text style={styles.finSubLabel}>
                                                    Package ({pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''} x ₱{pricingBreakdown.packageRatePerDay.toLocaleString()}/day)
                                                </Text>
                                                <Text style={styles.finSubValue}>₱{pricingBreakdown.packageSubtotal.toLocaleString()}</Text>
                                            </View>

                                            {pricingBreakdown.extraGuests > 0 && pricingBreakdown.extraGuestSubtotal > 0 && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>
                                                        Extra guests ({pricingBreakdown.extraGuests} x ₱{pricingBreakdown.extraFeePerHead.toLocaleString()} x {pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''})
                                                    </Text>
                                                    <Text style={styles.finSubValue}>₱{pricingBreakdown.extraGuestSubtotal.toLocaleString()}</Text>
                                                </View>
                                            )}

                                            {pricingBreakdown.accommodationSubtotal > 0 && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>
                                                        Accommodation ({pricingBreakdown.nights} night{pricingBreakdown.nights > 1 ? 's' : ''} x ₱{pricingBreakdown.accommodationRatePerNight.toLocaleString()}/night)
                                                    </Text>
                                                    <Text style={styles.finSubValue}>₱{pricingBreakdown.accommodationSubtotal.toLocaleString()}</Text>
                                                </View>
                                            )}

                                            {pricingBreakdown.hasAdjustment && (
                                                <View style={styles.finSubRow}>
                                                    <Text style={styles.finSubLabel}>Adjustment</Text>
                                                    <Text style={styles.finSubValue}>
                                                        {pricingBreakdown.adjustmentAmount >= 0 ? '₱' : '- ₱'}
                                                        {Math.abs(pricingBreakdown.adjustmentAmount).toLocaleString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </>
                                    )}

                                    <View style={styles.finRow}>
                                        <Text style={styles.finLabel}>Down Payment (Paid Online)</Text>
                                        <Text style={styles.finValue}>₱{down.toLocaleString()}</Text>
                                    </View>

                                    <View style={styles.finDivider} />

                                    <View style={styles.finRow}>
                                        <Text style={[styles.finLabel, {fontWeight:'700', color:'#B45309'}]}>Remaining Balance</Text>
                                        <Text style={[styles.finValue, {fontWeight:'800', color:'#B45309'}]}>
                                            ₱{Math.max(0, currentBalanceDue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {showRefundWindowHint && (
                            <Text style={[styles.refundPolicyText, refundWindowClosed && styles.refundPolicyTextWarning]}>
                                {refundWindowClosed
                                    ? `Refund window closed. Requests must be made at least ${REFUND_MIN_DAYS_BEFORE_CHECKIN} days before check-in.`
                                    : `Refund requests are allowed until ${REFUND_MIN_DAYS_BEFORE_CHECKIN} days before check-in.`}
                            </Text>
                        )}

                        <View style={styles.cardFooter}>
                            {isMyClient && (hasOpenRefund || isRefundCompleted) && (
                                <View style={styles.clientRefundStatePill}>
                                    <Ionicons name="return-down-back-outline" size={14} color="#1D4ED8" style={{marginRight: 6}} />
                                    <Text style={styles.clientRefundStateText}>{refundStateLabel}</Text>
                                </View>
                            )}

                            {canProceedToPayment && (
                                <TouchableOpacity style={styles.proceedButton} onPress={() => handleProceedToPayment(item)}>
                                    <Ionicons name="card-outline" size={14} color="#fff" style={{marginRight: 6}} />
                                    <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                                </TouchableOpacity>
                            )}

                            {canMessageProvider && (
                                <TouchableOpacity style={styles.messageButton} onPress={() => handleOpenMessage(item)}>
                                    <Ionicons name="chatbubble-outline" size={14} color="#fff" style={{marginRight: 6}} />
                                    <Text style={styles.messageButtonText}>{isAgencyPartner ? 'Message Agency' : 'Message Guide'}</Text>
                                </TouchableOpacity>
                            )}

                            {canRequestRefund && (
                                <TouchableOpacity style={styles.refundButton} onPress={() => handleOpenRefundRequest(item)}>
                                    <Ionicons name="return-down-back-outline" size={14} color="#fff" style={{marginRight: 6}} />
                                    <Text style={styles.refundButtonText}>Request Refund</Text>
                                </TouchableOpacity>
                            )}

                            {canCancel && (
                                <TouchableOpacity style={styles.cancelButton} onPress={() => initiateCancellation(item.id)}>
                                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                </TouchableOpacity>
                            )}

                            {canMarkPaid && (
                                <TouchableOpacity style={styles.paidButton} onPress={() => initiateMarkAsPaid(item.id)}>
                                    <Ionicons name="checkmark-done-circle" size={16} color="#fff" style={{marginRight:6}} />
                                    <Text style={styles.paidButtonText}>Confirm Balance Received</Text>
                                </TouchableOpacity>
                            )}

                            {canReview && (
                                <TouchableOpacity 
                                    style={styles.reviewButton} 
                                    onPress={() => router.push({ pathname: '/(protected)/reviewModal', params: { bookingId: item.id }})}
                                >
                                    <Ionicons name="star" size={14} color="#fff" style={{marginRight:6}} />
                                    <Text style={styles.reviewButtonText}>Leave a Review</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGroupItem = ({ item }) => {
        const completedCount = item.bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'completed').length;
        const acceptedCount = item.bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'accepted').length;
        const pendingCount = item.bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'pending_payment').length;
        const confirmedCount = item.bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'confirmed').length;
        const groupImageSource = getDestinationGroupImageSource(item);

        return (
            <View style={styles.groupContainer}>
                <View style={styles.groupHeaderCard}>
                    <View style={styles.groupImageWrap}>
                        {groupImageSource ? (
                            <Image source={groupImageSource} style={styles.groupImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.groupImageFallback}>
                                <Ionicons name="image-outline" size={24} color="#D6D3D1" />
                            </View>
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.45)']}
                            style={styles.groupImageOverlay}
                        />
                        <View style={styles.groupImageBadge}>
                            <Text style={styles.groupImageBadgeText}>{item.bookings.length} bookings</Text>
                        </View>
                    </View>

                    <View style={styles.groupHeaderTop}>
                        <View style={styles.groupTitleWrap}>
                            <Ionicons name="location" size={18} color="#A16207" />
                            <Text style={styles.groupTitle}>{item.title}</Text>
                        </View>
                    </View>

                    <View style={styles.groupMetaRow}>
                        <Text style={styles.groupMetaTextStrong}>
                            Latest booking: {item.latestBooking ? getBookingDateDisplay(item.latestBooking.check_in, item.latestBooking.check_out) : 'N/A'}
                        </Text>
                        <Text style={styles.groupMetaText}>Accepted: {acceptedCount}</Text>
                        <Text style={styles.groupMetaText}>Confirmed: {confirmedCount}</Text>
                        <Text style={styles.groupMetaText}>Completed: {completedCount}</Text>
                        <Text style={styles.groupMetaText}>Pending Payment: {pendingCount}</Text>
                    </View>

                    <TouchableOpacity style={styles.expandButton} onPress={() => openDestinationModal(item)}>
                        <Text style={styles.expandButtonText}>
                            View all bookings for this place
                        </Text>
                        <Ionicons name={'arrow-forward-circle'} size={18} color="#92400E" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView edges={['bottom']} style={styles.mainContainer}>
                <View style={styles.header}>
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                </View>
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={{ height: 160, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 16 }} />
                    <View style={{ height: 160, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 16 }} />
                    <View style={{ height: 160, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <ScreenSafeArea edges={['bottom', 'top']} style={styles.mainContainer}>
            <FlatList
                data={groupedBookings}
                renderItem={renderGroupItem}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                            <View style={styles.headerContent}>
                                <Text style={styles.headerTitle}>BOOKINGS MANAGER</Text>
                                <Text style={styles.headerSubtitle}>Your Trips & Client Requests</Text>
                            </View>
                        </View>

                        <View style={styles.topControlsContainer}>
                            <View style={styles.tabSwitcher}>
                                <TouchableOpacity
                                    style={[styles.tabButton, activeTab === 'my_trip' && styles.tabButtonActive]}
                                    onPress={() => switchTab('my_trip')}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={[styles.tabButtonText, activeTab === 'my_trip' && styles.tabButtonTextActive]}>MY TRIP</Text>
                                        {hasNewMyTrip && activeTab !== 'my_trip' && <View style={styles.tabBadgeDot} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tabButton, activeTab === 'client_booking' && styles.tabButtonActiveClient]}
                                    onPress={() => switchTab('client_booking')}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={[styles.tabButtonText, activeTab === 'client_booking' && styles.tabButtonTextActive]}>CLIENT BOOKING</Text>
                                        {hasNewClientBooking && activeTab !== 'client_booking' && <View style={styles.tabBadgeDot} />}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.filterLabel}>Status Filter</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'accepted', label: 'Accepted' },
                                    { value: 'confirmed', label: 'Confirmed' },
                                    { value: 'pending_payment', label: 'Pending Payment' },
                                    { value: 'refunded', label: 'Refunded' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.filterChip, statusFilter === option.value && styles.filterChipActive]}
                                        onPress={() => setStatusFilter(option.value)}
                                    >
                                        <Text style={[styles.filterChipText, statusFilter === option.value && styles.filterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.filterLabel}>Date Filter</Text>
                            <View style={styles.filterRowWrap}>
                                {[
                                    { value: 'all', label: 'All Dates' },
                                    { value: 'upcoming', label: 'Upcoming' },
                                    { value: 'past', label: 'Past' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.filterChip, dateFilter === option.value && styles.filterChipActive]}
                                        onPress={() => setDateFilter(option.value)}
                                    >
                                        <Text style={[styles.filterChipText, dateFilter === option.value && styles.filterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.filterLabel}>Find Destination</Text>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={16} color="#64748B" style={styles.searchIcon} />
                                <TextInput
                                    value={destinationSearch}
                                    onChangeText={setDestinationSearch}
                                    placeholder="Search by destination name"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.searchInput}
                                />
                                {!!destinationSearch && (
                                    <TouchableOpacity onPress={() => setDestinationSearch('')} style={styles.searchClearButton}>
                                        <Ionicons name="close-circle" size={18} color="#64748B" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.sectionSummaryText}>
                                Showing {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'} in {groupedBookings.length} place{groupedBookings.length === 1 ? '' : 's'}
                            </Text>
                            <Text style={styles.sortHintText}>Sorted by newest booking first.</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>
                            No {activeTab === 'my_trip' ? 'My Trip' : 'Client Booking'} records found for the selected filters.
                        </Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A8FF"]} />}
            />

            <BookingDetailsModal 
                booking={selectedBooking} 
                visible={detailsModalVisible} 
                onClose={handleCloseModal} 
                allBookings={bookings} 
            />

            <Modal
                visible={destinationModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeDestinationModal}
            >
                <View style={styles.destinationModalBackdrop}>
                    <View style={styles.destinationModalCard}>
                        <View style={styles.destinationModalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.destinationModalTitle} numberOfLines={2}>
                                    {selectedDestinationGroup?.title || 'Destination'}
                                </Text>
                                <Text style={styles.destinationModalSubtitle}>
                                    {modalFilteredBookings.length} of {selectedDestinationGroup?.bookings?.length || 0} booking{(selectedDestinationGroup?.bookings?.length || 0) === 1 ? '' : 's'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closeDestinationModal} style={styles.destinationCloseButton}>
                                <Ionicons name="close" size={18} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.destinationFiltersWrap}>
                            <Text style={styles.modalFilterLabel}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalFilterRow}>
                                {[
                                    { value: 'all', label: 'All' },
                                    { value: 'accepted', label: 'Accepted' },
                                    { value: 'confirmed', label: 'Confirmed' },
                                    { value: 'pending_payment', label: 'Pending Payment' },
                                    { value: 'refunded', label: 'Refunded' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.modalFilterChip, modalStatusFilter === option.value && styles.modalFilterChipActive]}
                                        onPress={() => setModalStatusFilter(option.value)}
                                    >
                                        <Text style={[styles.modalFilterChipText, modalStatusFilter === option.value && styles.modalFilterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.modalFilterLabel}>Date</Text>
                            <View style={styles.modalFilterRowWrap}>
                                {[
                                    { value: 'all', label: 'All Dates' },
                                    { value: 'upcoming', label: 'Upcoming' },
                                    { value: 'past', label: 'Past' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.modalFilterChip, modalDateFilter === option.value && styles.modalFilterChipActive]}
                                        onPress={() => setModalDateFilter(option.value)}
                                    >
                                        <Text style={[styles.modalFilterChipText, modalDateFilter === option.value && styles.modalFilterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalSearchContainer}>
                                <Ionicons name="search" size={15} color="#64748B" style={styles.searchIcon} />
                                <TextInput
                                    value={modalSearchFilter}
                                    onChangeText={setModalSearchFilter}
                                    placeholder="Search guest or booking"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.modalSearchInput}
                                />
                                {!!modalSearchFilter && (
                                    <TouchableOpacity onPress={() => setModalSearchFilter('')} style={styles.searchClearButton}>
                                        <Ionicons name="close-circle" size={17} color="#64748B" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <FlatList
                            data={modalFilteredBookings}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => renderBookingItem(item)}
                            contentContainerStyle={styles.destinationModalList}
                            ListEmptyComponent={
                                <View style={styles.emptyModalContainer}>
                                    <Text style={styles.emptyModalText}>No bookings match your modal filters.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            <ConfirmationModal 
                visible={confirmVisible}
                title="Cancel Booking?"
                description="Are you sure? You might lose your down payment based on the refund policy."
                confirmText="Yes, Cancel"
                cancelText="Keep it"
                onConfirm={confirmCancellation}
                onCancel={() => setConfirmVisible(false)}
            />

            <ConfirmationModal 
                visible={paidConfirmVisible}
                title="Confirm Payment"
                description="Has the tourist paid the remaining balance? This will mark the trip as Completed."
                confirmText="Yes, Payment Received"
                cancelText="Cancel"
                isDestructive={false}
                onConfirm={confirmMarkAsPaid}
                onCancel={() => setPaidConfirmVisible(false)}
            />

            {toast.show && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
                    <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </ScreenSafeArea>
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
    topControlsContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    tabSwitcher: { flexDirection: 'row', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 4, marginBottom: 12 },
    tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
    tabButtonActive: { backgroundColor: '#0EA5E9' },
    tabButtonActiveClient: { backgroundColor: '#F97316' },
    tabButtonText: { fontSize: 12, fontWeight: '800', color: '#475569' },
    tabButtonTextActive: { color: '#FFFFFF' },
    tabBadgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginLeft: 6,
        marginTop: -6,
    },
    filterLabel: { fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
    filterRow: { paddingBottom: 4, paddingRight: 8 },
    filterRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        marginRight: 8,
        marginBottom: 8,
    },
    filterChipActive: { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' },
    filterChipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
    filterChipTextActive: { color: '#0369A1', fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 10,
        marginTop: 2,
        marginBottom: 6,
    },
    searchIcon: { marginRight: 6 },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
        paddingVertical: 10,
    },
    searchClearButton: { paddingLeft: 8, paddingVertical: 4 },
    sectionSummaryText: { fontSize: 12, color: '#0F172A', fontWeight: '600', marginTop: 4 },
    sortHintText: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4 },
    listContainer: { paddingBottom: 40 },
    groupContainer: { marginBottom: 10 },
    groupHeaderCard: {
        marginHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E7E5E4',
        backgroundColor: '#FFFBF5',
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    groupImageWrap: {
        height: 128,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#E7E5E4',
    },
    groupImage: {
        width: '100%',
        height: '100%',
    },
    groupImageFallback: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F4',
    },
    groupImageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    groupImageBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(28,25,23,0.72)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    groupImageBadgeText: {
        color: '#F5F5F4',
        fontSize: 11,
        fontWeight: '700',
    },
    groupHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    groupTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
    groupTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
    groupMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 },
    groupMetaTextStrong: { color: '#7C2D12', fontSize: 12, fontWeight: '800', width: '100%' },
    groupMetaText: { color: '#57534E', fontSize: 12, fontWeight: '600' },
    groupProceedButton: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    groupProceedButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    expandButton: {
        marginTop: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E7E5E4',
        backgroundColor: '#FFF7ED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    expandButtonText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
    groupBookingsWrap: { marginTop: 10 },
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
    refundedBadge: { backgroundColor: '#CCFBF1' },
    refundedText: { color: '#0F766E', fontSize: 11, fontWeight: '700' },
    declinedBadge: { backgroundColor: '#FEE2E2' }, 
    declinedText: { color: '#991B1B', fontSize: 11, fontWeight: '700' },
    defaultBadge: { backgroundColor: '#F3F4F6' },
    defaultText: { color: '#4B5563', fontSize: 11 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    detailsContainer: { gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWidth: { width: 16, textAlign: 'center' },
    detailText: { fontSize: 13, color: '#4B5563' },
    
    financialBox: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#BBF7D0' },
    financialBoxTourist: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    finHeader: { fontSize: 10, fontWeight: '800', color: '#15803D', letterSpacing: 0.5, textTransform:'uppercase' },
    finHeaderTourist: { fontSize: 10, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.5, textTransform:'uppercase' },
    finRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    finLabel: { fontSize: 12, color: '#374151' },
    finValue: { fontSize: 12, fontWeight: '600', color: '#111827' },
    finSubRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3, paddingLeft: 20 },
    finSubLabel: { flex: 1, marginRight: 8, fontSize: 11, color: '#64748B' },
    finSubValue: { fontSize: 11, fontWeight: '600', color: '#334155' },
    finDivider: { height: 1, backgroundColor: '#DCFCE7', marginVertical: 6 },
    
    cardFooter: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
    proceedButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2563EB', borderRadius: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, elevation: 3, flexShrink: 1 },
    proceedButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cancelButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', flexShrink: 1 },
    cancelButtonText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
    paidButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#22C55E', borderRadius: 8, shadowColor: "#22C55E", shadowOpacity: 0.3, elevation: 3, flexShrink: 1 },
    paidButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    messageButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0EA5E9', borderRadius: 8, shadowColor: '#0EA5E9', shadowOpacity: 0.3, elevation: 3, flexShrink: 1 },
    messageButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    refundButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0F766E', borderRadius: 8, shadowColor: '#0F766E', shadowOpacity: 0.3, elevation: 3, flexShrink: 1 },
    refundButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    clientRefundStatePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#DBEAFE', borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', flexShrink: 1 },
    clientRefundStateText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
    reviewButton: { flexDirection:'row', alignItems:'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F59E0B', borderRadius: 8, shadowColor: "#F59E0B", shadowOpacity: 0.3, elevation: 3, flexShrink: 1 },
    reviewButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    refundPolicyText: { marginBottom: 10, color: '#0F766E', fontSize: 11, fontWeight: '700' },
    refundPolicyTextWarning: { color: '#B45309' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 10 },
    destinationModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        justifyContent: 'flex-end',
    },
    destinationModalCard: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '88%',
        minHeight: '55%',
        paddingTop: 8,
        paddingBottom: 12,
    },
    destinationModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginBottom: 6,
    },
    destinationModalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    destinationModalSubtitle: {
        fontSize: 12,
        color: '#475569',
        marginTop: 4,
        fontWeight: '600',
    },
    destinationCloseButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0',
        marginLeft: 12,
    },
    destinationModalList: { paddingTop: 8, paddingBottom: 22 },
    destinationFiltersWrap: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    modalFilterLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 8,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    modalFilterRow: { paddingBottom: 4, paddingRight: 8 },
    modalFilterRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
    modalFilterChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        marginRight: 8,
        marginBottom: 8,
    },
    modalFilterChipActive: { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' },
    modalFilterChipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
    modalFilterChipTextActive: { color: '#0369A1', fontWeight: '800' },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 10,
        marginTop: 2,
        marginBottom: 6,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
        paddingVertical: 10,
    },
    emptyModalContainer: { alignItems: 'center', paddingVertical: 30 },
    emptyModalText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    toastContainer: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: '#1F2937', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, width: '90%', shadowOpacity: 0.2, elevation: 5 },
    toastSuccess: { borderLeftWidth: 4, borderLeftColor: '#22C55E' },
    toastError: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
    toastText: { color: '#fff', marginLeft: 10, fontWeight: '600' }
});