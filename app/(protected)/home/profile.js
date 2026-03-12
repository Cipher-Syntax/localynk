import React, { useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    ActivityIndicator, 
    ScrollView, 
    StyleSheet, 
    StatusBar, 
    Image, 
    TouchableOpacity, 
    RefreshControl, 
    Dimensions, 
    Alert,
    Modal 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/api";

const { width } = Dimensions.get('window');

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // --- MODAL STATES ---
    const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false); 
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    
    const { user, logout, refreshUser } = useAuth(); 
    const params = useLocalSearchParams();
    const userId = params.userId;
    const [profile, setProfile] = useState(null);
    
    const [pendingCount, setPendingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    
    const router = useRouter();

    const fetchProfileData = async () => {
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
    };

    useEffect(() => {
        if (!userId && user) {
            setProfile(user);
        }
    }, [user, userId]);

    useEffect(() => {
        const fetchBookingStats = async () => {
            if (profile && profile.is_local_guide && profile.id) {
                try {
                    const response = await api.get('api/bookings/');
                    let bookingsList = [];
                    if (Array.isArray(response.data)) {
                        bookingsList = response.data;
                    } else if (response.data.results) {
                        bookingsList = response.data.results;
                    }
                    const pending = bookingsList.filter(booking => booking.status === 'Pending');
                    setPendingCount(pending.length);
                    const completed = bookingsList.filter(booking => booking.status === 'Completed');
                    setCompletedCount(completed.length);
                } catch (error) {
                    setPendingCount(0);
                    setCompletedCount(0);
                }
            }
        };
        fetchBookingStats();
    }, [profile]);

    useFocusEffect(
        useCallback(() => {
            const loadInitialData = async () => {
                if (!profile) setLoading(true);
                await fetchProfileData();
                setLoading(false);
            };
            loadInitialData();
        }, [userId])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProfileData();
        setRefreshing(false);
    }, [userId]);

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

    const isOwnProfile = !userId || (user && profile && user.id === profile.id);
    const isGuide = profile.is_local_guide && profile.guide_approved;

    const profileData = {
        name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.username || "User",
        image: profile.profile_picture || null, 
        stats: isGuide ? { 
            tours: pendingCount, 
            completions: completedCount, 
            rating: profile.guide_rating || 0 
        } : null
    };

    const touristSettingsItems = [
        { id: 1, icon: "bookmarks", label: "My Bookings", route: '/(protected)/bookings' },
        { id: 2, icon: "heart", label: "Favorite Guides", route: '/favorites' },
        { id: 3, icon: "map", label: "My Travel Interests", route: '/(protected)/onboarding/personalization?mode=edit' },
        { id: 6, icon: "help-circle", label: "Help & Support", route: '/(protected)/support' }
    ];

    const guideSettingsItems = [
        { id: 1, icon: "calendar", label: "My Bookings", route: '/(protected)/bookings' },
        { id: 5, icon: "cash", label: "Earnings & Payments", route: '/(protected)/earnings' },
        { id: 2, icon: "heart", label: "Favorite Guides", route: '/favorites' },
        { id: 3, icon: "map", label: "My Travel Interests", route: '/(protected)/onboarding/personalization?mode=edit' },
        { id: 4, icon: "business", label: "View Accommodations", route: `/(protected)/viewAccommodations?userId=${profile.id}` },
        { id: 7, icon: "briefcase", label: "Tour Packages", route: '/(protected)/myTourPackages' },
        { id: 6, icon: "star", label: "Reviews & Ratings", route: '/myReviews' },
        { id: 9, icon: "help-circle", label: "Help & Support", route: '/(protected)/support' }
    ];

    const menuItems = isGuide ? guideSettingsItems : touristSettingsItems;

    return (
        <View style={{flex: 1}}>
            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
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
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
                            {isGuide ? "GUIDE PROFILE" : "TOURIST PROFILE"}
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
                                            <Text style={styles.detailText}>{profile.phone_number}</Text>
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
                                            onPress={() => item.route && router.push(item.route)}
                                        >
                                            <View style={[styles.menuIconBox, { backgroundColor: isGuide ? '#EFF6FF' : '#ECFDF5' }]}>
                                                <Ionicons name={item.icon} size={20} color={isGuide ? '#0072FF' : '#10B981'} />
                                            </View>
                                            <Text style={styles.menuLabel}>{item.label}</Text>
                                            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.menuTitle, {marginTop: 25}]}>Settings</Text>
                                <View style={styles.menuContainer}>
                                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit_profile')}>
                                        <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                                            <Ionicons name="person-circle" size={22} color="#64748B" />
                                        </View>
                                        <Text style={styles.menuLabel}>Edit Profile</Text>
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
                                
                                <Text style={styles.versionText}>LocaLynk v1.0.2</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Logout Confirmation Modal */}
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

            {/* UPDATED: Deactivate Confirmation Modal */}
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

            {/* UPDATED: Deactivate Success Modal */}
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
        </View>
    );
}

export default Profile;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    bodyContainer: { flex: 1, backgroundColor: '#F8FAFC', marginTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
    avatarContainer: { alignItems: 'center', marginTop: -60, marginBottom: 15 },
    avatarWrapper: { position: 'relative', padding: 4, backgroundColor: '#fff', borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0072FF', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    infoSection: { alignItems: 'center', marginBottom: 25 },
    profileName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10, marginTop: 4 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginHorizontal: 4 },
    bioText: { textAlign: 'center', fontSize: 14, color: '#475569', lineHeight: 20, marginHorizontal: 20 },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 30, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    statLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
    verticalDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0' },
    menuSection: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10, marginLeft: 5 },
    menuContainer: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    menuItemLast: { borderBottomWidth: 0 },
    menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
    logoutButton: { marginTop: 30, marginBottom: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
    versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, marginTop: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { marginBottom: 16 },
    warningIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
    modalMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
    cancelButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
    confirmButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
    confirmButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
});