import { View, Text, ActivityIndicator, ScrollView, StyleSheet, StatusBar, Image, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../../../context/AuthContext' // <-- Using the AUTH CONTEXT

export default function Profile() {
    const [loading, setLoading] = useState(true);
    // Destructure role, user object, and loading state from AuthContext
    const { role, isLoading: isAuthLoading, user, logout } = useAuth();
    
    // Derived state based on role
    const isGuide = role === 'guide';
    const isTourist = role === 'tourist';
    
    const router = useRouter()

    useEffect(() => {
        // Simulate initial screen fade/resource load
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Combine local loading state with Auth loading state
    if (loading || isAuthLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    
    // --- MOCK DATA (Should ideally be fetched via a dedicated API endpoint) ---
    const profileData = {
        // Use real user data if available, otherwise fallback
        name: user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user?.username,
        recentTours: [
            { id: 1, title: "Historic City Walking Tour", rating: 5, guide: "Guide Joshua Jameson", date: "Oct 15, 2025" },
            { id: 2, title: "Mountain Hiking", rating: 3, guide: "Guide Frank Sabastine", date: "Sept 20, 2025" }
        ],
        // Mock stats based on role
        stats: isGuide ? { bookings: 12, completions: 50, rating: 4.8 } : null
    };

    // Settings Menu Items (Adjusted based on standard user vs guide focus)
    const touristSettingsItems = [
        { id: 1, icon: "bookmarks-outline", label: "My Bookings", hasNotification: true },
        { id: 2, icon: "heart-outline", label: "Favorite Guides" },
        { id: 3, icon: "card-outline", label: "Payment Methods" },
        { id: 4, icon: "shield-outline", label: "Privacy and Security" },
        { id: 5, icon: "help-circle-outline", label: "Help and Support" }
    ];

    const guideSettingsItems = [
        { id: 1, icon: "calendar-outline", label: "My Reservations", hasNotification: true },
        { id: 2, icon: "home-outline", label: "View Accommodations" },
        { id: 3, icon: "wallet-outline", label: "Earnings/Payouts" },
        { id: 4, icon: "settings-outline", label: "Guide Profile Settings" },
        { id: 5, icon: "shield-outline", label: "Privacy and Security" }
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView>
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

                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person-circle-outline" size={80} color="#1a2f5a" />
                        </View>
                        <Text style={styles.profileName}>{profileData.name}</Text>
                        {
                            isGuide ? (
                                <Text style={styles.badge}>Tourist / Local Guide</Text>
                            ) : (
                                <Text style={styles.badge}>Tourist</Text>
                            )
                        }
                    </View>

                    {/* DYNAMIC STATS CONTAINER */}
                    {isGuide && profileData.stats && (
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Ionicons name="map" size={20} color="#1a2f5a" />
                                <Text style={styles.statNumber}>{profileData.stats.tours}</Text>
                                <Text style={styles.statLabel}>Tours Created</Text>
                            </View>
                            <View style={styles.statItem}>
                                <AntDesign name="star" size={20} color="#FFD700" />
                                <Text style={styles.statNumber}>{profileData.stats.rating}</Text>
                                <Text style={styles.statLabel}>Avg. Rating</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#00c853" />
                                <Text style={styles.statNumber}>{profileData.stats.completions}</Text>
                                <Text style={styles.statLabel}>Completed Tours</Text>
                            </View>
                        </View>
                    )}
                    {/* END DYNAMIC STATS */}
                    
                    <View style={styles.recentToursSection}>
                        <Text style={styles.sectionTitle}>Recent Tours</Text>
                        {profileData.recentTours.map((tour) => (
                            <View key={tour.id} style={styles.tourItem}>
                                <Ionicons name="images" size={24} color="#1a2f5a" style={styles.tourIcon} />
                                <View style={styles.tourInfo}>
                                    <Text style={styles.tourTitle}>{tour.title}</Text>
                                    <Text style={styles.tourDetails}>{tour.guide}</Text>
                                    <Text style={styles.tourDate}>{tour.date}</Text>
                                </View>
                                <View style={styles.ratingContainer}>
                                    <AntDesign name="star" size={16} color="#FFD700" />
                                    <Text style={styles.ratingNumber}>{tour.rating}.0</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.settingsSection}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        {(isGuide ? guideSettingsItems : touristSettingsItems).map((item) => (
                            <TouchableOpacity key={item.id} style={styles.settingItem}>
                                <View style={styles.settingLeft}>
                                    <Ionicons name={item.icon} size={20} color="#1a2f5a" />
                                    <Text style={styles.settingLabel}>{item.label}</Text>
                                </View>
                                {item.hasNotification ? (
                                    <View style={styles.notification}>
                                        <Text style={styles.notificationText}>1</Text>
                                    </View>
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color="#1a2f5a" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.editButton}>
                            <Text style={styles.buttonText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.logoutButton} 
                            onPress={async () => {
                                await logout();
                            }}
                        >
                            <Text style={styles.logoutButtonText}>Log Out</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Use a standard light background
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    profileCard: {
        position: 'relative',
        // backgroundColor: '#fff', // White background for the card
        marginHorizontal: 16,
        marginTop: 30,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        // shadowOffset: { width: 0, height: 5 },
        // shadowRadius: 10,
        // elevation: 5,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        backgroundColor: '#EBF0F5',
        borderRadius: 50,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a2f5a',
        marginBottom: 4,
    },
    badge: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        backgroundColor: '#00A8FF', // Guide color
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        textTransform: 'uppercase'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#EBF0F5',
        borderRadius: 12,
        paddingVertical: 12,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2f5a',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    recentToursSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a2f5a',
        marginBottom: 12,
        marginLeft: 4,
    },
    tourItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#E0E6ED'
    },
    tourIcon: {
        marginRight: 12,
        marginTop: 4,
    },
    tourInfo: {
        flex: 1,
    },
    tourTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a2f5a',
        marginBottom: 2,
    },
    tourDetails: {
        fontSize: 11,
        color: '#666',
        marginBottom: 2,
    },
    tourDate: {
        fontSize: 10,
        color: '#999',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingNumber: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1a2f5a',
        marginLeft: 4,
    },
    settingsSection: {
        marginBottom: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E6ED'
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1a2f5a',
    },
    notification: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    buttonContainer: {
        gap: 12,
        paddingHorizontal: 4,
        paddingBottom: 20
    },
    editButton: {
        backgroundColor: '#00A8FF',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    logoutButton: {
        backgroundColor: '#FF5A5F', // Use a distinct color for logout
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
});