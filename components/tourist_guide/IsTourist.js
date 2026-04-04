import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Image, Text, ScrollView, TouchableOpacity, Alert, Modal, Switch, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

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

    const fetchBookings = async () => {
        try {
            const bookingRes = await api.get('/api/bookings/', {
                params: { view_as: 'guide' }
            });
            
            // Keep guide-side trips only for dashboard analytics and filtering.
            const sorted = bookingRes.data
                .filter(b => {
                    const isMyOwnTrip = Number(b.tourist_id) === Number(user?.id);
                    const isValidStatus = b.status === 'Confirmed' || b.status === 'Completed';
                    return isValidStatus && !isMyOwnTrip; 
                })
                .sort((a,b) => new Date(b.check_in) - new Date(a.check_in));
                
            setBookings(sorted);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

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
    }, [getBookingMessagePartner]);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
            refreshUser(); 
        }, [])
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
        } catch (error) {
            setIsGuideActive(!newStatus);
            showToast("Failed to update status.", 'error');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
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
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const ratingValue = user?.average_rating ? parseFloat(user.average_rating).toFixed(1) : "0.0";

    const filteredTrips = useMemo(() => {
        return bookings.filter((booking) => {
            const normalized = String(booking.status || '').toLowerCase();
            if (tripFilter === 'all') return true;
            if (tripFilter === 'upcoming') return normalized === 'confirmed';
            if (tripFilter === 'completed') return normalized === 'completed';
            return true;
        });
    }, [bookings, tripFilter]);

    const statsData = [
        { label: "Total Trips", value: totalBookings.toString(), icon: "stats-chart", color: "#00C6FF", subtext: "All time" },
        { label: "Upcoming", value: confirmedBookings.toString(), icon: "calendar", color: "#00E676", subtext: "Locked dates" },
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
                            { value: 'upcoming', label: `Upcoming (${confirmedBookings})` },
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
                            const touristDisplayName = normalizeDisplayName(booking.tourist_username, 'Unknown User');
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
                                { value: 'upcoming', label: `Upcoming (${confirmedBookings})` },
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    tierBadge: { position: 'absolute', top: 35, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    tierBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 6 },
    mainContent: { flexDirection: "column", gap: 15, paddingBottom: 40 },
    statusToggleContainer: { width: '90%', alignSelf: 'center', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
    statusTextContainer: { flex: 1 },
    readyPromptText: { fontSize: 12, color: '#8B98A8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 18, fontWeight: '800' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15, gap: 10, marginTop: 5 },
    statCard: { backgroundColor: '#253347', borderRadius: 12, padding: 12, width: '48%', height: 100, justifyContent: 'space-between', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 30, fontWeight: '700', color: '#fff' },
    statLabel: { fontSize: 13, color: '#B0B8C4', fontWeight: '600' },
    statSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    bookingsSection: { padding: 15, marginTop: 0 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#253347', letterSpacing: 0.5, marginBottom: 15, marginTop: 5 },
    tripsSectionHeader: { marginTop: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
    tripsSectionSubtext: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    viewAllTripsBtn: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllTripsBtnText: { fontSize: 12, color: '#111827', fontWeight: '700' },
    tripFilterRow: { paddingBottom: 8, paddingRight: 8 },
    tripFilterRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 8 },
    tripFilterChip: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 0,
    },
    tripFilterChipActive: { borderColor: '#111827', backgroundColor: '#111827' },
    tripFilterChipText: { color: '#4B5563', fontWeight: '600', fontSize: 12 },
    tripFilterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
    tripCardsRow: { paddingRight: 8 },
    tripCardsColumn: { gap: 10 },
    sectionHelpText: { fontSize: 12, color: '#64748B', marginTop: -8, marginBottom: 14, fontWeight: '500' },
    stepCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: '#F0F0F0', position: 'relative', overflow: 'hidden' },
    stepCardActive: { backgroundColor: '#fff', borderColor: '#0072FF', borderWidth: 2, shadowColor: '#0072FF', shadowOpacity: 0.15 },
    stepCardDone: { borderColor: '#00C853', backgroundColor: '#F9FFF9' },
    startBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#0072FF', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
    startBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    doneEditableBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#00C853', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12 },
    doneEditableBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepNumberContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    stepNumberContainerActive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0072FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    stepNumberContainerDone: { backgroundColor: '#00C853', borderColor: '#00C853' },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { fontSize: 14, fontWeight: '700', color: '#fff' },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginBottom: 2 },
    stepTitleActive: { fontSize: 16, fontWeight: '800', color: '#0072FF', marginBottom: 2 },
    stepTitleDone: { color: '#2E7D32', fontWeight: '800' },
    stepDesc: { fontSize: 12, color: '#6B7280' },
    stepHint: { marginTop: 5, fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    stepHintActive: { color: '#0072FF' },
    stepHintDone: { color: '#16A34A' },
    chevronContainer: { paddingLeft: 10, justifyContent: 'center' },
    chevronContainerActive: { paddingLeft: 10, justifyContent: 'center', backgroundColor: '#F0F9FF', width: 36, height: 36, borderRadius: 18, alignItems: 'center' },
    chevronContainerDone: { backgroundColor: '#E8F5E9', width: 36, height: 36, borderRadius: 18, alignItems: 'center' },
    connectorContainer: { paddingLeft: 34, height: 16, justifyContent: 'center' },
    dottedLine: { width: 2, height: '100%', borderStyle: 'dotted', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 1 },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#B0B8C4' },
    emptyStateLight: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
    emptyStateText: { marginTop: 10, color: '#B0B8C4', fontSize: 14 },
    bookingCard: { backgroundColor: '#253347', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#253347', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    bookingCardWhite: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginRight: 0,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    bookingCardWhiteModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    cardHeaderWhite: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 8 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '800' },
    avatarPlaceholderWhite: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    avatarLetterWhite: { color: '#334155', fontSize: 16, fontWeight: '800' },
    touristName: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    touristNameWhite: { fontSize: 15, fontWeight: '700', color: '#0F172A', letterSpacing: 0.2, flexShrink: 1 },
    touristRole: { fontSize: 12, color: '#B0B8C4', fontWeight: '500' },
    touristRoleWhite: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusBadgeTight: { flexShrink: 1, maxWidth: '42%' },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 15 },
    cardBodyLight: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEF2F7' },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateItem: { alignItems: 'center', flex: 1 },
    dateDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
    dateLabel: { color: '#8B98A8', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
    dateValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    dateDividerLight: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
    dateLabelLight: { color: '#64748B', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
    dateValueLight: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
    messageBtn: { width: '100%', height: 44, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    messageBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    messageBtnLight: { width: '100%', height: 40, backgroundColor: '#F3F4F6', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    messageBtnTextLight: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
    moreTripsHint: {
        marginTop: 10,
        alignSelf: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    moreTripsHintText: { fontSize: 12, color: '#374151', fontWeight: '600' },
    toastContainer: { position: 'absolute', bottom: 40, left: 20, right: 20, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 1000 },
    toastSuccess: { backgroundColor: '#00c853' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '80%', elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#253347' },

    // MODAL PLAN STYLES
    planCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    premiumCard: {
        backgroundColor: '#FFF',
        borderColor: '#FFAB00',
        borderWidth: 1,
        shadowColor: '#FFAB00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    activePlanBorder: {
        borderColor: '#00C853',
        borderWidth: 2,
        backgroundColor: '#F0FDF4',
    },
    planHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    planName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    planCost: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    currentBadge: {
        backgroundColor: '#94A3B8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    currentBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    bestValueBadge: {
        backgroundColor: '#FFAB00',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bestValueText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    planFeatures: {
        gap: 8,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    upgradeBtnModal: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    upgradeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});
