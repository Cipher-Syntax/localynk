import { View, Text, ActivityIndicator, ScrollView, StyleSheet, StatusBar, Image, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [isTourist, setIsTourist] = useState(true);
    const [activeTab, setActiveTab] = useState("bookings");
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff"
            }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const profileData = {
        name: "Francis Minoville",
        recentTours: [
            { id: 1, title: "Historic City Walking Tour", rating: 5, guide: "Guide Joshua Jameson", date: "Oct 15, 2025" },
            { id: 2, title: "Mountain Hiking", rating: 3, guide: "Guide Frank Sabastine", date: "Sept 20, 2025" }
        ],
        stats: isTourist ? null : { tours: 2, completions: 10, saved: 3 }
    };

    const accountSettingsItems = [
        { id: 1, icon: "bookmark", label: "My Bookings", hasNotification: true },
        { id: 2, icon: "heart", label: "View Accommodations" },
        { id: 3, icon: "card", label: "Payment Methods" },
        { id: 4, icon: "shield", label: "Privacy and Security" },
        { id: 5, icon: "help-circle", label: "Help and Support" }
    ];

    const tourGuideSettings = [
        { id: 1, icon: "bookmark", label: "My Bookings", hasNotification: true },
        { id: 2, icon: "heart", label: "Favorite Guides" },
        { id: 3, icon: "card", label: "Payment Methods" },
        { id: 4, icon: "shield", label: "Privacy and Security" },
        { id: 5, icon: "help-circle", label: "Help and Support" }
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
                        {isTourist ? "PROFILE" : "PROFILE"}
                    </Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person-circle-outline" size={80} color="#1a2f5a" />
                        </View>
                        <Text style={styles.profileName}>{profileData.name}</Text>
                        {/* {!isTourist && (
                            <Text style={styles.badge}>PROFILE CUSTOMIZED</Text>
                        )} */}
                    </View>

                    {isTourist && (
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Ionicons name="map" size={20} color="#1a2f5a" />
                                <Text style={styles.statNumber}>2</Text>
                                <Text style={styles.statLabel}>Tours</Text>
                            </View>
                            <View style={styles.statItem}>
                                <AntDesign name="star" size={20} color="#FFD700" />
                                <Text style={styles.statNumber}>10</Text>
                                <Text style={styles.statLabel}>Completions</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="bookmark" size={20} color="#1a2f5a" />
                                <Text style={styles.statNumber}>3</Text>
                                <Text style={styles.statLabel}>Saved</Text>
                            </View>
                        </View>
                    )}

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
                        {(isTourist ? accountSettingsItems : tourGuideSettings).map((item) => (
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
                        <TouchableOpacity style={styles.logoutButton} onPress={() => router.push({pathname: "/auth/login"})}>
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
        // backgroundColor: '#D9E2E9',
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
        // backgroundColor: '#c8d5eb',
        marginHorizontal: 16,
        marginTop: 50,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        marginBottom: 80,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
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
        backgroundColor: '#1a2f5a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
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
    },
    tourItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        alignItems: 'flex-start',
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
        marginBottom: 10,
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
    },
    editButton: {
        backgroundColor: '#1a2f5a',
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
        backgroundColor: '#1a2f5a',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1a2f5a',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#0f1e3f',
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        color: '#666',
        fontWeight: '500',
    }
});
