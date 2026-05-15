import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, Switch, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/api";
import { ScreenSafeArea } from "../../../components";
import {
    getLatestBookingTimestamp,
    getSeenBookingTabTimestamp,
    setSeenBookingTabTimestamp,
    setSeenBookingTimestamp,
    getLatestEarningsTimestamp,
    hasUnseenEarnings,
    setSeenEarningsTimestamp,
} from "../../../utils/bookingNotifications";
import { formatPHPhoneLocal } from "../../../utils/phoneNumber";
import { hasProfileAttentionDot, isPayoutAccountIncomplete } from "../../../utils/profileCompleteness";

import { styles } from './styles/profile.styles';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusBarStyle, setStatusBarStyle] = useState('light-content');
    
    const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false); 
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    
    const { user, logout, refreshUser, updateUserProfile, syncPushNotificationPreference } = useAuth(); 
    const params = useLocalSearchParams();
    const userId = params.userId;
    const [profile, setProfile] = useState(null);
    
    const [pendingCount, setPendingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [hasNewBookingDot, setHasNewBookingDot] = useState(false);
    const [hasNewEarningsDot, setHasNewEarningsDot] = useState(false);
    const [latestEarningsTs, setLatestEarningsTs] = useState(0);
    const [notificationPrefs, setNotificationPrefs] = useState({ push: true, email: true });
    const [notificationSaving, setNotificationSaving] = useState({ push: false, email: false });
    
    const router = useRouter();
    const isOwnProfile = !userId || (user && profile && user.id === profile.id);

    const fetchProfileData = useCallback(async () => {
        try {
            if (userId) {
                const response = await api.get(`/api/guides/${userId}/`);
                setProfile(response.data);
            } else {
                await refreshUser();
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    }, [refreshUser, userId]);

    useEffect(() => {
        if (!userId && user) {
            setProfile(user);
        }
    }, [user, userId]);

    const fetchBookingStats = useCallback(async ({ markSeen = false } = {}) => {
        if (!user?.id) return;
        try {
            const response = await api.get('api/bookings/');
            let bookingsList = [];
            if (Array.isArray(response.data)) {
                bookingsList = response.data;
            } else if (response.data.results) {
                bookingsList = response.data.results;
            }

            if (profile?.is_local_guide && profile?.id) {
                const pending = bookingsList.filter(booking => String(booking.status || '').toLowerCase() === 'pending_payment');
                setPendingCount(pending.length);
                const completed = bookingsList.filter(booking => String(booking.status || '').toLowerCase() === 'completed');
                setCompletedCount(completed.length);
            } else {
                setPendingCount(0);
                setCompletedCount(0);
            }

            const latestTs = getLatestBookingTimestamp(bookingsList);
            const myTrips = bookingsList.filter((booking) => Number(booking?.tourist_id) === Number(user.id));
            const clientBookings = bookingsList.filter((booking) => Number(booking?.tourist_id) !== Number(user.id));
            const latestMyTripTs = getLatestBookingTimestamp(myTrips);
            const latestClientBookingTs = getLatestBookingTimestamp(clientBookings);

            const earningsTs = getLatestEarningsTimestamp(bookingsList, user.id);
            setLatestEarningsTs(earningsTs);

            if (markSeen) {
                if (latestMyTripTs > 0) {
                    await setSeenBookingTabTimestamp(user.id, 'my_trip', latestMyTripTs);
                }
                if (latestClientBookingTs > 0) {
                    await setSeenBookingTabTimestamp(user.id, 'client_booking', latestClientBookingTs);
                }
                if (latestTs > 0) {
                    await setSeenBookingTimestamp(user.id, latestTs);
                }
                setHasNewBookingDot(false);
                if (earningsTs > 0) {
                    await setSeenEarningsTimestamp(user.id, earningsTs);
                }
                setHasNewEarningsDot(false);
            } else {
                const seenMyTripTs = await getSeenBookingTabTimestamp(user.id, 'my_trip');
                const seenClientBookingTs = await getSeenBookingTabTimestamp(user.id, 'client_booking');
                const hasUnseenBookingTabs =
                    latestMyTripTs > seenMyTripTs || latestClientBookingTs > seenClientBookingTs;
                setHasNewBookingDot(hasUnseenBookingTabs);
                const unseenEarnings = await hasUnseenEarnings(user.id, bookingsList);
                setHasNewEarningsDot(unseenEarnings);
            }
        } catch (_error) {
            setPendingCount(0);
            setCompletedCount(0);
            setHasNewBookingDot(false);
            setHasNewEarningsDot(false);
        }
    }, [profile?.id, profile?.is_local_guide, user?.id]);


    useEffect(() => {
        fetchBookingStats();
    }, [fetchBookingStats]);

    useEffect(() => {
        if (!isOwnProfile || !profile) return;

        setNotificationPrefs({
            push: typeof profile.push_enabled === 'boolean' ? profile.push_enabled : true,
            email: typeof profile.email_enabled === 'boolean' ? profile.email_enabled : true,
        });
    }, [isOwnProfile, profile]);

    useFocusEffect(
        useCallback(() => {
            const loadInitialData = async () => {
                if (!profile) setLoading(true);
                await fetchProfileData();
                await fetchBookingStats({ markSeen: false });
                setLoading(false);
            };
            loadInitialData();
        }, [fetchBookingStats, profile, fetchProfileData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProfileData();
        await fetchBookingStats({ markSeen: false });
        setRefreshing(false);
    }, [fetchBookingStats, fetchProfileData]);

    const handleScroll = useCallback((event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const nextStyle = offsetY > 40 ? 'dark-content' : 'light-content';
        setStatusBarStyle((prevStyle) => (prevStyle === nextStyle ? prevStyle : nextStyle));
    }, []);

    const handleDeactivate = () => {
        setDeactivateModalVisible(true);
    };

    const confirmDeactivation = async () => {
        try {
            setDeactivateModalVisible(false);
            setLoading(true);
            
            await api.post('/api/auth/deactivate/');
            
            setLoading(false);
            
            setTimeout(() => {
                setSuccessModalVisible(true);
            }, 300);

        } catch (error) {
            setLoading(false);
            Alert.alert("Error", "Could not deactivate account. Please try again.");
            console.error(error);
        }
    };

    const handleFinalLogout = async () => {
        setSuccessModalVisible(false);
        await logout(); 
    };

    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        await logout();
    };

    const handleNotificationPreferenceToggle = useCallback(async (channel, nextValue) => {
        if (!isOwnProfile) return;

        const prefKey = channel === 'push' ? 'push_enabled' : 'email_enabled';
        const stateKey = channel === 'push' ? 'push' : 'email';
        const previousValue = notificationPrefs[stateKey];

        setNotificationPrefs(prev => ({ ...prev, [stateKey]: nextValue }));
        setNotificationSaving(prev => ({ ...prev, [stateKey]: true }));

        const updated = await updateUserProfile({ [prefKey]: nextValue });

        if (!updated) {
            setNotificationPrefs(prev => ({ ...prev, [stateKey]: previousValue }));
            setNotificationSaving(prev => ({ ...prev, [stateKey]: false }));
            Alert.alert('Update Failed', 'Unable to save notification preference. Please try again.');
            return;
        }

        if (channel === 'push') {
            await syncPushNotificationPreference(nextValue);
        }

        await fetchProfileData();
        setNotificationSaving(prev => ({ ...prev, [stateKey]: false }));
    }, [fetchProfileData, isOwnProfile, notificationPrefs, syncPushNotificationPreference, updateUserProfile]);

    if (loading && !profile) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ alignItems: 'center', marginTop: -50 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E6ED', borderWidth: 4, borderColor: '#fff' }} />
                </View>
                <View style={{ paddingHorizontal: 20, marginTop: 15, alignItems: 'center' }}>
                    <View style={{ width: 180, height: 24, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 10 }} />
                    <View style={{ width: 220, height: 14, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 20 }} />
                    
                    <View style={{ width: '100%', height: 80, backgroundColor: '#fff', borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#eee' }} />
                    
                    <View style={{ alignSelf: 'flex-start', width: 100, height: 18, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 10 }} />
                    <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#eee' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: i === 5 ? 0 : 1, borderBottomColor: '#F1F5F9' }}>
                                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E0E6ED', marginRight: 15 }} />
                                <View style={{ width: 150, height: 16, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    if (!profile && !loading) {
         return (
            <View style={styles.centerContainer}>
                <Text style={{color: '#64748B'}}>Profile not found.</Text>
            </View>
        );
    }

    const isGuide = profile.is_local_guide && profile.guide_approved;
    const profileTarget = profile || user;
    const hasMissingPayoutSetup = isOwnProfile && isPayoutAccountIncomplete(profileTarget);
    const hasIncompleteProfileSetup = isOwnProfile && hasProfileAttentionDot(profileTarget);

    const profileData = {
        name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.username || "User",
        email: profile.email || "Email not linked (Log out and log in to fix)", // Fallback added here
        image: profile.profile_picture || null, 
        stats: isGuide ? { 
            tours: pendingCount, 
            completions: completedCount, 
            rating: profile.guide_rating || 0 
        } : null
    };

    const touristSettingsItems = [
        { id: 1, icon: "bookmarks", label: "My Bookings", route: '/(protected)/bookings' },
        { id: 8, icon: "chatbubbles", label: "Conversations", route: '/(protected)/conversations' },
        { id: 2, icon: "heart", label: "Favorite Guides", route: '/favorites' },
        { id: 3, icon: "map", label: "My Travel Interests", route: '/(protected)/onboarding/personalization?mode=edit' },
        { id: 6, icon: "help-circle", label: "Help & Support", route: '/(protected)/support' }
    ];

    const guideSettingsItems = [
        { id: 1, icon: "calendar", label: "My Bookings", route: '/(protected)/bookings' },
        { id: 8, icon: "chatbubbles", label: "Conversations", route: '/(protected)/conversations' },
        { id: 5, icon: "cash", label: "Earnings & Payments", route: '/(protected)/earnings' },
        { id: 2, icon: "heart", label: "Favorite Guides", route: '/favorites' },
        { id: 3, icon: "map", label: "My Travel Interests", route: '/(protected)/onboarding/personalization?mode=edit' },
        { id: 4, icon: "business", label: "View Accommodations", route: `/(protected)/viewAccommodations?userId=${profile.id}` },
        { id: 7, icon: "briefcase", label: "Tour Packages", route: '/(protected)/myTourPackages' },
        { id: 6, icon: "star", label: "Reviews & Ratings", route: '/myReviews' },
        { id: 9, icon: "help-circle", label: "Help & Support", route: '/(protected)/support' }
    ];

    const menuItems = isGuide ? guideSettingsItems : touristSettingsItems;
    const notificationControlsDisabled = notificationSaving.push || notificationSaving.email;

    const handleMenuPress = async (item) => {
        if (!item.route) return;

        if (item.label === 'Earnings & Payments' && user?.id) {
            if (latestEarningsTs > 0) {
                await setSeenEarningsTimestamp(user.id, latestEarningsTs);
            }
            setHasNewEarningsDot(false);
        }

        router.push(item.route);
    };

    return (
        <ScreenSafeArea statusBarStyle={statusBarStyle} edges={[]}>
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        colors={["#00C6FF"]} 
                        tintColor="#00C6FF" 
                    />
                }
            >
                <View>
                    <View style={styles.header}>
                        <Image
                            source={require('../../../assets/localynk_images/header.png')}
                            style={styles.headerImage}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                            style={styles.overlay}
                        />
                        <Text style={styles.headerTitle}>
                            {isGuide ? "PROFILE" : "PROFILE"}
                        </Text>
                    </View>

                    <View style={styles.bodyContainer}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarWrapper}>
                                {profileData.image ? (
                                    <Image source={{ uri: profileData.image }} style={styles.avatarImage} />
                                ) : (
                                    <View style={[styles.avatarImage, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Ionicons name="person" size={50} color="#CBD5E1" />
                                    </View>
                                )}
                                {isOwnProfile && (
                                    <TouchableOpacity style={styles.editAvatarBadge} onPress={() => router.push('/profile/edit_profile')}>
                                        <Ionicons name="camera" size={14} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.profileName}>{profileData.name}</Text>
                            
                            {/* --- EMAIL RENDERED HERE --- */}
                            <View style={[styles.detailItem, { marginBottom: 6, marginTop: 2 }]}>
                                <Ionicons name="mail" size={14} color="#94A3B8" />
                                <Text style={styles.detailText}>{profileData.email}</Text>
                            </View>

                            {(profile.location || profile.phone_number) && (
                                <View style={styles.detailRow}>
                                    {profile.location && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="location-sharp" size={14} color="#94A3B8" />
                                            <Text style={styles.detailText}>{profile.location}</Text>
                                        </View>
                                    )}
                                    {profile.location && profile.phone_number && (
                                        <View style={styles.dotSeparator} />
                                    )}
                                    {profile.phone_number && (
                                        <View style={styles.detailItem}>
                                            <Ionicons name="call" size={14} color="#94A3B8" />
                                            <Text style={styles.detailText}>{formatPHPhoneLocal(profile.phone_number)}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            {profile.bio && (
                                <Text style={styles.bioText} numberOfLines={4}>{profile.bio}</Text>
                            )}
                        </View>

                        {isGuide && profileData.stats && (
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profileData.stats.tours}</Text>
                                    <Text style={styles.statLabel}>Tours</Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.statItem}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
                                        <Text style={styles.statValue}>{parseFloat(profileData.stats.rating).toFixed(1)}</Text>
                                        <AntDesign name="star" size={14} color="#FFD700" />
                                    </View>
                                    <Text style={styles.statLabel}>Rating</Text>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profileData.stats.completions}</Text>
                                    <Text style={styles.statLabel}>Trips</Text>
                                </View>
                            </View>
                        )}

                        {isOwnProfile && (
                            <View style={styles.menuSection}>
                                <Text style={styles.menuTitle}>General</Text>
                                <View style={styles.menuContainer}>
                                    {menuItems.map((item, index) => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
                                            onPress={() => handleMenuPress(item)}
                                        >
                                            <View style={[styles.menuIconBox, { backgroundColor: isGuide ? '#EFF6FF' : '#ECFDF5' }]}>
                                                <Ionicons name={item.icon} size={20} color={isGuide ? '#0072FF' : '#10B981'} />
                                            </View>
                                            <Text style={styles.menuLabel}>{item.label}</Text>
                                            {item.label === 'My Bookings' && hasNewBookingDot && <View style={styles.menuBadgeDot} />}
                                            {item.label === 'Earnings & Payments' && (hasNewEarningsDot || hasMissingPayoutSetup) && <View style={styles.menuBadgeDot} />}
                                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.menuTitle, {marginTop: 25}]}>Settings</Text>
                                <View style={styles.menuContainer}>
                                    <View style={styles.notificationPreferenceWrap}>
                                        <Text style={styles.notificationPreferenceTitle}>Notification Preferences</Text>

                                        <View style={styles.notificationPreferenceRow}>
                                            <View style={styles.notificationPreferenceTextWrap}>
                                                <Text style={styles.notificationPreferenceLabel}>Push Notifications</Text>
                                                <Text style={styles.notificationPreferenceHint}>Receive in-app push alerts for new activity.</Text>
                                            </View>
                                            {notificationSaving.push ? (
                                                <ActivityIndicator size="small" color="#2563EB" />
                                            ) : (
                                                <Switch
                                                    value={notificationPrefs.push}
                                                    onValueChange={(value) => handleNotificationPreferenceToggle('push', value)}
                                                    disabled={notificationControlsDisabled}
                                                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                                    thumbColor={notificationPrefs.push ? '#2563EB' : '#F8FAFC'}
                                                />
                                            )}
                                        </View>

                                        <View style={[styles.notificationPreferenceRow, styles.notificationPreferenceRowLast]}>
                                            <View style={styles.notificationPreferenceTextWrap}>
                                                <Text style={styles.notificationPreferenceLabel}>Email Notifications</Text>
                                                <Text style={styles.notificationPreferenceHint}>Receive activity updates through email.</Text>
                                            </View>
                                            {notificationSaving.email ? (
                                                <ActivityIndicator size="small" color="#2563EB" />
                                            ) : (
                                                <Switch
                                                    value={notificationPrefs.email}
                                                    onValueChange={(value) => handleNotificationPreferenceToggle('email', value)}
                                                    disabled={notificationControlsDisabled}
                                                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                                                    thumbColor={notificationPrefs.email ? '#2563EB' : '#F8FAFC'}
                                                />
                                            )}
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit_profile')}>
                                        <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                                            <Ionicons name="person-circle" size={22} color="#64748B" />
                                        </View>
                                        <Text style={styles.menuLabel}>Edit Profile</Text>
                                        {hasIncompleteProfileSetup && <View style={styles.menuBadgeDot} />}
                                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeactivate}>
                                        <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                        </View>
                                        <Text style={[styles.menuLabel, { color: '#EF4444' }]}>Deactivate Account</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
                                    <Text style={styles.logoutText}>Log Out</Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.versionText}>LocaLynk v1.0.0</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={logoutModalVisible}
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.warningIconContainer}>
                                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
                            </View>
                        </View>
                        <Text style={styles.modalTitle}>Log Out?</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to log out of your account?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                                <Text style={styles.confirmButtonText}>Yes, Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={deactivateModalVisible}
                onRequestClose={() => setDeactivateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.warningIconContainer}>
                                <Ionicons name="warning" size={32} color="#EF4444" />
                            </View>
                        </View>
                        <Text style={styles.modalTitle}>Deactivate Account?</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to deactivate?
                            {"\n\n"}
                            Your account will be <Text style={{fontWeight: '700'}}>scheduled for deletion in 365 days</Text>. 
                            {"\n\n"}
                            You can reactive it anytime before deletion by simply logging back in.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setDeactivateModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={confirmDeactivation}>
                                <Text style={styles.confirmButtonText}>Yes, Deactivate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={successModalVisible}
                onRequestClose={() => {}} 
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.warningIconContainer, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="checkmark" size={32} color="#10B981" />
                            </View>
                        </View>
                        
                        <Text style={styles.modalTitle}>Scheduled for Deletion</Text>
                        
                        <Text style={styles.modalMessage}>
                            Your account has been deactivated.
                            {"\n\n"}
                            It will be permanently deleted in <Text style={{fontWeight: '700', color:'#10B981'}}>365 days</Text>.
                            {"\n\n"}
                            You will now be logged out.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.confirmButton, { backgroundColor: '#10B981', flex: 1 }]}
                                onPress={handleFinalLogout}
                            >
                                <Text style={styles.confirmButtonText}>Okay, Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenSafeArea>
    );
}

export default Profile;
