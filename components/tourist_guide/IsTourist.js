import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Switch, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { styles } from './styles/IsTourist.styles';

const normalizeDisplayName = (rawValue, fallback = 'User') => {
    const raw = String(rawValue || '').trim();
    if (!raw) return fallback;

    if (!raw.includes('@')) {
        return raw;
    }

    const local = raw.split('@', 1)[0].replace(/[._-]+/g, ' ').trim();
    if (!local) return fallback;

    return local
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const parseDateOnly = (rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return null;

    const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
    const parts = datePart.split('-').map((value) => Number(value));
    if (parts.length === 3 && parts.every((value) => Number.isFinite(value))) {
        const [year, month, day] = parts;
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
            parsed.setHours(0, 0, 0, 0);
            return parsed;
        }
    }

    const fallback = new Date(raw);
    if (Number.isNaN(fallback.getTime())) return null;
    fallback.setHours(0, 0, 0, 0);
    return fallback;
};

const getTripTimingState = (booking, today) => {
    const normalizedStatus = String(booking?.status || '').toLowerCase();
    const checkInDate = parseDateOnly(booking?.check_in);
    const checkOutDate = parseDateOnly(booking?.check_out) || checkInDate;
    const tripEndDate = checkOutDate || checkInDate;
    const hasEnded = tripEndDate ? tripEndDate.getTime() < today.getTime() : false;

    const isUpcomingStatus = ['pending_payment', 'accepted', 'confirmed'].includes(normalizedStatus);
    const isUpcoming = isUpcomingStatus && !hasEnded;
    const isCompleted = normalizedStatus === 'completed' || (isUpcomingStatus && hasEnded);

    return { isUpcoming, isCompleted };
};

const IsTourist = () => {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isGuideActive, setIsGuideActive] = useState(false); 
    const [modalVisible, setModalVisible] = useState(false);
    const [tripModalVisible, setTripModalVisible] = useState(false);
    const [tripFilter, setTripFilter] = useState('upcoming');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // State for Dynamic Pricing
    const [subscriptionPrice, setSubscriptionPrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(true);

    // Progress Flags from Backend
    const setupProgress = user?.setup_progress || { has_info: false, has_accommodation: false, has_tour: false };

    useEffect(() => {
        if (user) {
            setIsGuideActive(user.is_guide_visible || false);
        }
    }, [user]);

    // Fetch Subscription Price from Backend
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await api.get('/api/payments/subscription-price/');
                setSubscriptionPrice(response.data.price);
            } catch (error) {
                console.error('Failed to fetch subscription price:', error);
            } finally {
                setLoadingPrice(false);
            }
        };
        fetchPrice();
    }, []);

    const fetchBookings = useCallback(async () => {
        try {
            const bookingRes = await api.get('/api/bookings/', {
                params: { view_as: 'guide' }
            });

            const incoming = Array.isArray(bookingRes.data)
                ? bookingRes.data
                : Array.isArray(bookingRes.data?.results)
                    ? bookingRes.data.results
                    : [];

            const guideDashboardStatuses = new Set([
                'pending_payment',
                'accepted',
                'confirmed',
                'completed',
            ]);
            
            // Keep guide-side trips only for dashboard analytics and filtering.
            const sorted = incoming
                .filter(b => {
                    const isMyOwnTrip = Number(b.tourist_id) === Number(user?.id);
                    const normalizedStatus = String(b?.status || '').toLowerCase();
                    const isValidStatus = guideDashboardStatuses.has(normalizedStatus);
                    return isValidStatus && !isMyOwnTrip; 
                })
                .sort((a, b) => new Date(a.check_in) - new Date(b.check_in));
                
            setBookings(sorted);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    }, [user?.id]);

    const getBookingMessagePartner = useCallback((booking) => {
        const currentUserId = Number(user?.id);
        const touristId = Number(booking?.tourist_id);
        const guideId = Number(booking?.guide_detail?.id || booking?.guide);
        const agencyId = Number(booking?.agency_detail?.id || booking?.agency);

        if (touristId > 0 && touristId !== currentUserId) {
            return {
                id: touristId,
                name: normalizeDisplayName(booking?.tourist_username, 'Tourist'),
            };
        }

        if (guideId > 0 && guideId !== currentUserId) {
            const fullName = `${booking?.guide_detail?.first_name || ''} ${booking?.guide_detail?.last_name || ''}`.trim();
            return {
                id: guideId,
                name: fullName || booking?.guide_detail?.username || 'Guide',
            };
        }

        if (agencyId > 0 && agencyId !== currentUserId) {
            return {
                id: agencyId,
                name: booking?.agency_detail?.username || 'Agency',
            };
        }

        return null;
    }, [user?.id]);

    const openMessageFromBooking = useCallback((booking, closeModal = false) => {
        const partner = getBookingMessagePartner(booking);

        if (!partner) {
            showToast('Unable to find the correct receiver for this trip.', 'error');
            return;
        }

        if (closeModal) {
            setTripModalVisible(false);
        }

        router.push({
            pathname: '/(protected)/message',
            params: { partnerId: partner.id, partnerName: partner.name }
        });
    }, [getBookingMessagePartner, router]);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
            refreshUser(); 
        }, [fetchBookings, refreshUser])
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
        } catch (_error) {
            setIsGuideActive(!newStatus);
            showToast("Failed to update status.", 'error');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Pending_Payment':
                return { color: '#EA580C', bg: 'rgba(251, 146, 60, 0.16)', icon: 'wallet-outline', label: 'Pending Payment' };
            case 'Accepted':
                return { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.14)', icon: 'thumbs-up-outline', label: 'Accepted' };
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
    const tripCounts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings.reduce((acc, booking) => {
            const timing = getTripTimingState(booking, today);
            if (timing.isUpcoming) acc.upcoming += 1;
            if (timing.isCompleted) acc.completed += 1;
            return acc;
        }, { upcoming: 0, completed: 0 });
    }, [bookings]);

    const upcomingBookings = tripCounts.upcoming;
    const completedBookings = tripCounts.completed;
    const rawGuideRating = user?.guide_rating ?? user?.average_rating;
    const parsedGuideRating = Number.parseFloat(rawGuideRating);
    const ratingValue = Number.isFinite(parsedGuideRating) ? parsedGuideRating.toFixed(1) : "0.0";

    const filteredTrips = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings.filter((booking) => {
            const timing = getTripTimingState(booking, today);
            if (tripFilter === 'all') return true;
            if (tripFilter === 'upcoming') return timing.isUpcoming;
            if (tripFilter === 'completed') return timing.isCompleted;
            return true;
        });
    }, [bookings, tripFilter]);

    console.log(filteredTrips)

    const statsData = [
        { label: "Total Trips", value: totalBookings.toString(), icon: "stats-chart", color: "#00C6FF", subtext: "All time" },
        { label: "Upcoming", value: upcomingBookings.toString(), icon: "calendar", color: "#00E676", subtext: "Locked dates" },
        { label: "Completed", value: completedBookings.toString(), icon: "checkmark-done-circle", color: "#FFD700", subtext: "Successful tours" },
        { label: "Rating", value: ratingValue, icon: "star", color: "#FFAB00", subtext: "Average" }
    ];

    const renderChecklistItem = (stepNumber, title, description, isCompleted, isCurrent, route, doneBadgeText, doneHintText) => {
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
                {isDone && (
                    <View style={styles.doneEditableBadge}><Text style={styles.doneEditableBadgeText}>{doneBadgeText || 'COMPLETED • TAP TO OPEN'}</Text></View>
                )}
                <View style={styles.stepRow}>
                    <View style={[styles.stepNumberContainer, isActive && styles.stepNumberContainerActive, isDone && styles.stepNumberContainerDone]}>
                        {isDone ? <Ionicons name="checkmark" size={18} color="#fff" /> : <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{stepNumber}</Text>}
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive, isDone && styles.stepTitleDone]}>{title}</Text>
                        <Text style={styles.stepDesc}>{description}</Text>
                        <Text style={[styles.stepHint, isActive && styles.stepHintActive, isDone && styles.stepHintDone]}>
                            {isDone ? (doneHintText || 'You can reopen this anytime.') : (isActive ? 'Start this step now.' : 'Tap to continue setup.')}
                        </Text>
                    </View>
                    <View style={[styles.chevronContainer, isActive && styles.chevronContainerActive, isDone && styles.chevronContainerDone]}>
                        <Ionicons name={isDone ? "create-outline" : "chevron-forward"} size={20} color={isActive ? "#0072FF" : (isDone ? "#00C853" : "#B0B8C4")} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>

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
                    <Text style={styles.sectionHelpText}>Complete steps in order. Some steps are editable, while others let you add more entries anytime.</Text>
                    {renderChecklistItem(1, "Update Guide Info", "Set your profile & daily rates", setupProgress.has_info, !setupProgress.has_info, "/(protected)/UpdateGuideInfoForm", "COMPLETED • TAP TO EDIT", "You can edit your guide info anytime.")}
                    <View style={styles.connectorContainer}><View style={[styles.dottedLine, setupProgress.has_info && { borderColor: '#00C853', borderStyle: 'solid' }]} /></View>
                    {renderChecklistItem(2, "Add Accommodation", "List places for tourists to stay", setupProgress.has_accommodation, setupProgress.has_info && !setupProgress.has_accommodation, "/(protected)/addAccommodation", "COMPLETED • TAP TO ADD MORE", "You can add more accommodations anytime.")}
                    <View style={styles.connectorContainer}><View style={[styles.dottedLine, setupProgress.has_accommodation && { borderColor: '#00C853', borderStyle: 'solid' }]} /></View>
                    {renderChecklistItem(3, "Add Tour Packages", "Create your unique tour offers", setupProgress.has_tour, setupProgress.has_accommodation && !setupProgress.has_tour, "/(protected)/addTour", "COMPLETED • TAP TO ADD MORE", "You can create more tour packages anytime.")}

                    <View style={styles.tripsSectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 4 }]}>TRIPS</Text>
                            <Text style={styles.tripsSectionSubtext}>No long page scroll. Swipe cards or open full list.</Text>
                        </View>
                        <TouchableOpacity style={styles.viewAllTripsBtn} onPress={() => setTripModalVisible(true)}>
                            <Text style={styles.viewAllTripsBtnText}>View All</Text>
                            <Ionicons name="arrow-forward" size={14} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tripFilterRowWrap}>
                        {[
                            { value: 'upcoming', label: `Upcoming (${upcomingBookings})` },
                            { value: 'completed', label: `Completed (${completedBookings})` },
                            { value: 'all', label: `All (${totalBookings})` },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.tripFilterChip, tripFilter === option.value && styles.tripFilterChipActive]}
                                onPress={() => setTripFilter(option.value)}
                            >
                                <Text style={[styles.tripFilterChipText, tripFilter === option.value && styles.tripFilterChipTextActive]} numberOfLines={1}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {filteredTrips.length === 0 ? (
                         <View style={styles.emptyStateLight}>
                            <Ionicons name="calendar-outline" size={40} color="#B0B8C4" />
                            <Text style={styles.emptyStateText}>No {tripFilter === 'upcoming' ? 'upcoming' : (tripFilter === 'completed' ? 'completed' : '')} trips yet.</Text>
                        </View>
                    ) : (
                        <View style={styles.tripCardsColumn}>
                        {filteredTrips.slice(0, 2).map((booking) => {
                            const statusStyle = getStatusStyles(booking.status);
                            const touristDisplayName = normalizeDisplayName(
                                `${booking.tourist_detail?.first_name || ''} ${booking.tourist_detail?.last_name || ''}`.trim(),
                                'Unknown User'
                            );
                            return (
                                <View key={booking.id} style={styles.bookingCardWhite}>
                                    <View style={styles.cardHeaderWhite}>
                                        <View style={styles.userInfo}>
                                            <View style={styles.avatarPlaceholderWhite}>
                                                <Text style={styles.avatarLetterWhite}>{touristDisplayName.charAt(0).toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.touristNameWhite} numberOfLines={1} ellipsizeMode="tail">{touristDisplayName}</Text>
                                                <Text style={styles.touristRoleWhite} numberOfLines={1}>Tourist</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, styles.statusBadgeTight, { backgroundColor: statusStyle.bg }]}>
                                            <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} style={{marginRight: 4}}/>
                                            <Text style={[styles.statusText, { color: statusStyle.color }]} numberOfLines={1}>{statusStyle.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardBodyLight}>
                                        <View style={styles.dateContainer}>
                                            <View style={styles.dateItem}>
                                                <Text style={styles.dateLabelLight}>Check In</Text>
                                                <Text style={styles.dateValueLight} numberOfLines={1}>{booking.check_in}</Text>
                                            </View>
                                            <View style={styles.dateDividerLight} />
                                            <View style={styles.dateItem}>
                                                <Text style={styles.dateLabelLight}>Check Out</Text>
                                                <Text style={styles.dateValueLight} numberOfLines={1}>{booking.check_out}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.messageBtnLight}
                                        onPress={() => openMessageFromBooking(booking)}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={16} color="#0F172A" style={{marginRight: 8}} />
                                        <Text style={styles.messageBtnTextLight}>Message Client</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                        </View>
                    )}

                    {filteredTrips.length > 2 && (
                        <TouchableOpacity style={styles.moreTripsHint} onPress={() => setTripModalVisible(true)}>
                            <Text style={styles.moreTripsHintText}>+ {filteredTrips.length - 2} more trip(s). Tap View All.</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Toast Notification */}
            {toast.visible && (
                <View style={[styles.toastContainer, styles.toastSuccess]}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}
            
            {/* Membership Plans Modal */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                         <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Membership Plans</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* FREE TIER CARD */}
                            <View style={[styles.planCard, user?.guide_tier !== 'paid' && styles.activePlanBorder]}>
                                <View style={styles.planHeaderRow}>
                                    <View>
                                        <Text style={styles.planName}>Free Tier</Text>
                                        <Text style={styles.planCost}>₱0.00 / forever</Text>
                                    </View>
                                    {user?.guide_tier !== 'paid' && (
                                        <View style={styles.currentBadge}>
                                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.planFeatures}>
                                    <View style={styles.featureRow}>
                                        <Ionicons name="checkmark" size={16} color="#64748B" />
                                        <Text style={styles.featureText}>Basic Profile Visibility</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <Ionicons name="alert-circle-outline" size={16} color="#FFAB00" />
                                        {/* Updated Limit Text */}
                                        <Text style={styles.featureText}>1 Active Booking Limit</Text>
                                    </View>
                                </View>
                            </View>

                            {/* PREMIUM TIER CARD */}
                            <View style={[styles.planCard, styles.premiumCard, user?.guide_tier === 'paid' && styles.activePlanBorder]}>
                                <View style={styles.planHeaderRow}>
                                    <View>
                                        <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                                            <Text style={styles.planName}>Premium Guide</Text>
                                            <Ionicons name="ribbon" size={18} color="#FFAB00" />
                                        </View>
                                        {/* Dynamic Price */}
                                        {loadingPrice ? (
                                            <ActivityIndicator size="small" color="#64748B" style={{marginTop: 5, alignSelf: 'flex-start'}} />
                                        ) : (
                                            <Text style={styles.planCost}>₱{subscriptionPrice || '00.00'} / year</Text>
                                        )}
                                    </View>
                                    {user?.guide_tier === 'paid' ? (
                                        <View style={[styles.currentBadge, {backgroundColor:'#00C853'}]}>
                                            <Text style={styles.currentBadgeText}>ACTIVE</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.bestValueBadge}>
                                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <View style={styles.planFeatures}>
                                    <View style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00C853" />
                                        <Text style={styles.featureText}>Accept Unlimited Bookings</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00C853" />
                                        <Text style={styles.featureText}>Verified Guide Badge</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00C853" />
                                        <Text style={styles.featureText}>Priority Support</Text>
                                    </View>
                                </View>

                                {user?.guide_tier !== 'paid' && (
                                    <TouchableOpacity 
                                        style={styles.upgradeBtnModal}
                                        onPress={() => {
                                            setModalVisible(false);
                                            router.push('/(protected)/upgradeMembership');
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#0072FF', '#00C6FF']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.gradientBtn}
                                        >
                                            <Text style={styles.upgradeBtnText}>UPGRADE NOW</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={tripModalVisible} onRequestClose={() => setTripModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>All Trips</Text>
                            <TouchableOpacity onPress={() => setTripModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>

                        <View style={[styles.tripFilterRowWrap, { paddingBottom: 8 }]}> 
                            {[
                                { value: 'upcoming', label: `Upcoming (${upcomingBookings})` },
                                { value: 'completed', label: `Completed (${completedBookings})` },
                                { value: 'all', label: `All (${totalBookings})` },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.tripFilterChip, tripFilter === option.value && styles.tripFilterChipActive]}
                                    onPress={() => setTripFilter(option.value)}
                                >
                                    <Text style={[styles.tripFilterChipText, tripFilter === option.value && styles.tripFilterChipTextActive]} numberOfLines={1}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredTrips.map((booking) => {
                                const statusStyle = getStatusStyles(booking.status);
                                const touristDisplayName = normalizeDisplayName(booking.tourist_username, 'Unknown User');
                                return (
                                    <View key={`modal-${booking.id}`} style={styles.bookingCardWhiteModal}>
                                        <View style={styles.cardHeaderWhite}>
                                            <View style={styles.userInfo}>
                                                <View style={styles.avatarPlaceholderWhite}>
                                                    <Text style={styles.avatarLetterWhite}>{touristDisplayName.charAt(0).toUpperCase()}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.touristNameWhite} numberOfLines={1} ellipsizeMode="tail">{touristDisplayName}</Text>
                                                    <Text style={styles.touristRoleWhite} numberOfLines={1}>Tourist</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, styles.statusBadgeTight, { backgroundColor: statusStyle.bg }]}>
                                                <Ionicons name={statusStyle.icon} size={12} color={statusStyle.color} style={{marginRight: 4}}/>
                                                <Text style={[styles.statusText, { color: statusStyle.color }]} numberOfLines={1}>{statusStyle.label}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBodyLight}>
                                            <View style={styles.dateContainer}>
                                                <View style={styles.dateItem}>
                                                    <Text style={styles.dateLabelLight}>Check In</Text>
                                                    <Text style={styles.dateValueLight} numberOfLines={1}>{booking.check_in}</Text>
                                                </View>
                                                <View style={styles.dateDividerLight} />
                                                <View style={styles.dateItem}>
                                                    <Text style={styles.dateLabelLight}>Check Out</Text>
                                                    <Text style={styles.dateValueLight} numberOfLines={1}>{booking.check_out}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.messageBtnLight}
                                            onPress={() => openMessageFromBooking(booking, true)}
                                        >
                                            <Ionicons name="chatbubble-ellipses" size={16} color="#0F172A" style={{marginRight: 8}} />
                                            <Text style={styles.messageBtnTextLight}>Message Client</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            {filteredTrips.length === 0 && (
                                <View style={styles.emptyStateLight}>
                                    <Ionicons name="calendar-outline" size={40} color="#B0B8C4" />
                                    <Text style={styles.emptyStateText}>No trips available for this filter.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default IsTourist;
