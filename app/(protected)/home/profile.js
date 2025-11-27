// import { View, Text, ActivityIndicator, ScrollView, StyleSheet, StatusBar, Image, TouchableOpacity } from "react-native";
// import React, { useState, useEffect } from "react";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons, AntDesign } from "@expo/vector-icons";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useAuth } from "../../../context/AuthContext";
// import api from "../../../api/api";

// export default function Profile() {
//     const [loading, setLoading] = useState(true);
//     const { user, logout } = useAuth();
//     const params = useLocalSearchParams();
//     const userId = params.userId;
//     const [profile, setProfile] = useState(null);
//     const router = useRouter();

//     useEffect(() => {
//         const fetchProfile = async () => {
//             try {
//                 const response = await api.get(`/api/guides/${userId}/`);
//                 setProfile(response.data);
//             } catch (error) {
//                 console.error("Failed to fetch profile:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (userId) {
//             fetchProfile();
//         } else {
//             setProfile(user);
//             setLoading(false);
//         }
//     }, [userId, user]);

//     if (loading || !profile) {
//         return (
//             <View style={styles.centerContainer}>
//                 <ActivityIndicator size="large" color="#0000ff" />
//             </View>
//         );
//     }

//     const isOwnProfile = !userId || (user && profile && user.id === profile.id);
//     const isGuide = profile.is_local_guide && profile.guide_approved;
//     const isTourist = profile.is_tourist;

//     const profileData = {
//         name: profile.first_name && profile.last_name 
//             ? `${profile.first_name} ${profile.last_name}` 
//             : profile.username || "User",
//         image: profile.profile_picture || null, 
//         recentTours: [
//             { id: 1, title: "Historic City Walking Tour", rating: 5, guide: "Guide Joshua Jameson", date: "Oct 15, 2025" },
//             { id: 2, title: "Mountain Hiking", rating: 3, guide: "Guide Frank Sabastine", date: "Sept 20, 2025" }
//         ],
//         stats: isGuide ? { bookings: 12, completions: 50, rating: 4.8 } : null
//     };

//     const touristSettingsItems = [
//         { id: 1, icon: "bookmarks-outline", label: "My Bookings", hasNotification: true },
//         { id: 2, icon: "heart-outline", label: "Favorite Guides" },
//         { id: 3, icon: "card-outline", label: "Payment Methods" },
//         { id: 4, icon: "shield-outline", label: "Privacy and Security" },
//         { id: 5, icon: "help-circle-outline", label: "Help and Support" }
//     ];

//     const guideSettingsItems = [
//         { id: 1, icon: "calendar-outline", label: "My Reservations", hasNotification: true },
//         { id: 2, icon: "home-outline", label: "View Accommodations" },
//         { id: 3, icon: "wallet-outline", label: "Earnings/Payouts" },
//         { id: 4, icon: "settings-outline", label: "Guide Profile Settings" },
//         { id: 5, icon: "shield-outline", label: "Privacy and Security" }
//     ];

//     return (
//         <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//             <View>
//                 <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//                 <View style={styles.header}>
//                     <Image
//                         source={require('../../../assets/localynk_images/header.png')}
//                         style={styles.headerImage}
//                     />
//                     <LinearGradient
//                         colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
//                         style={styles.overlay}
//                     />
//                     <Text style={styles.headerTitle}>
//                         {isGuide ? "GUIDE PROFILE" : "TOURIST PROFILE"}
//                     </Text>
//                 </View>

//                 <View style={styles.profileCard}>
//                     <View style={styles.profileHeader}>
                        
//                         <View style={styles.profileImagePlaceholder}>
//                             {profileData.image ? (
//                                 <Image 
//                                     source={{ uri: profileData.image }} 
//                                     style={styles.realProfileImage} 
//                                 />
//                             ) : (
//                                 <Ionicons name="person-circle-outline" size={80} color="#1a2f5a" />
//                             )}
//                         </View>

//                         <Text style={styles.profileName}>{profileData.name}</Text>
//                         {
//                             isGuide ? (
//                                 <Text style={styles.badge}>Tourist / Local Guide</Text>
//                             ) : (
//                                 <Text style={styles.badge}>Tourist</Text>
//                             )
//                         }

//                         {profile.phone_number && (
//                             <Text style={styles.profileDetail}>
//                                 <Ionicons name="call-outline" size={14} color="#666" /> {profile.phone_number}
//                             </Text>
//                         )}
//                         {profile.location && (
//                             <Text style={styles.profileDetail}>
//                                 <Ionicons name="location-outline" size={14} color="#666" /> {profile.location}
//                             </Text>
//                         )}
//                         {profile.bio && (
//                             <Text style={styles.profileBio}>{profile.bio}</Text>
//                         )}
//                     </View>

//                     {isGuide && profileData.stats && (
//                         <View style={styles.statsContainer}>
//                             <View style={styles.statItem}>
//                                 <Ionicons name="map" size={20} color="#1a2f5a" />
//                                 <Text style={styles.statNumber}>{profileData.stats.tours}</Text>
//                                 <Text style={styles.statLabel}>Tours Created</Text>
//                             </View>
//                             <View style={styles.statItem}>
//                                 <AntDesign name="star" size={20} color="#FFD700" />
//                                 <Text style={styles.statNumber}>{profileData.stats.rating}</Text>
//                                 <Text style={styles.statLabel}>Avg. Rating</Text>
//                             </View>
//                             <View style={styles.statItem}>
//                                 <Ionicons name="checkmark-circle" size={20} color="#00c853" />
//                                 <Text style={styles.statNumber}>{profileData.stats.completions}</Text>
//                                 <Text style={styles.statLabel}>Completed Tours</Text>
//                             </View>
//                         </View>
//                     )}
                    
//                     {/* <View style={styles.recentToursSection}>
//                         <Text style={styles.sectionTitle}>Recent Tours</Text>
//                         {profileData.recentTours.map((tour) => (
//                             <View key={tour.id} style={styles.tourItem}>
//                                 <Ionicons name="images" size={24} color="#1a2f5a" style={styles.tourIcon} />
//                                 <View style={styles.tourInfo}>
//                                     <Text style={styles.tourTitle}>{tour.title}</Text>
//                                     <Text style={styles.tourDetails}>{tour.guide}</Text>
//                                     <Text style={styles.tourDate}>{tour.date}</Text>
//                                 </View>
//                                 <View style={styles.ratingContainer}>
//                                     <AntDesign name="star" size={16} color="#FFD700" />
//                                     <Text style={styles.ratingNumber}>{tour.rating}.0</Text>
//                                 </View>
//                             </View>
//                         ))}
//                     </View> */}

//                     {isOwnProfile && (
//                         <View style={styles.settingsSection}>
//                             <Text style={styles.sectionTitle}>Account Settings</Text>
//                             {(isGuide ? guideSettingsItems : touristSettingsItems).map((item) => (
//                                 <TouchableOpacity
//                                     key={item.id}
//                                     style={styles.settingItem}
//                                     onPress={() => {
//                                         // Navigate to View Accommodations page for guides
//                                         if (item.label === 'View Accommodations') {
//                                             router.push(`/(protected)/viewAccommodations?userId=${profile.id}`);
//                                             return;
//                                         }

//                                         // Handle other items if needed (placeholder)
//                                         // For now, navigate to a generic settings route or noop
//                                         // router.push('/settings');
//                                     }}
//                                 >
//                                     <View style={styles.settingLeft}>
//                                         <Ionicons name={item.icon} size={20} color="#1a2f5a" />
//                                         <Text style={styles.settingLabel}>{item.label}</Text>
//                                     </View>
//                                     {item.hasNotification ? (
//                                         <View style={styles.notification}>
//                                             <Text style={styles.notificationText}>1</Text>
//                                         </View>
//                                     ) : (
//                                         <Ionicons name="chevron-forward" size={20} color="#1a2f5a" />
//                                     )}
//                                 </TouchableOpacity>
//                             ))}
//                         </View>
//                     )}

//                     {isOwnProfile && (
//                         <View style={styles.buttonContainer}>
//                             <TouchableOpacity 
//                                 style={styles.editButton}
//                                 onPress={() => router.push('/profile/edit_profile')}
//                             >
//                                 <Ionicons name="create-outline" size={18} color="#fff" style={{marginRight: 5}} />
//                                 <Text style={styles.buttonText}>Edit Profile</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity 
//                                 style={styles.logoutButton} 
//                                 onPress={async () => {
//                                     await logout();
//                                 }}
//                             >
//                                 <Ionicons name="log-out-outline" size={18} color="#fff" style={{marginRight: 5}} />
//                                 <Text style={styles.logoutButtonText}>Log Out</Text>
//                             </TouchableOpacity>
//                         </View>
//                     )}
//                 </View>
//             </View>
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#F5F7FA', 
//     },
//     centerContainer: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "#fff"
//     },
//     header: {
//         position: 'relative',
//         height: 120,
//         justifyContent: 'center',
//     },
//     headerImage: {
//         width: '100%',
//         height: '100%',
//         resizeMode: 'cover',
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//     },
//     headerTitle: {
//         position: 'absolute',
//         bottom: 15,
//         left: 20,
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: '700',
//         letterSpacing: 1,
//     },
//     profileCard: {
//         position: 'relative',
//         marginHorizontal: 16,
//         marginTop: 30,
//         borderRadius: 20,
//         paddingVertical: 20,
//         paddingHorizontal: 16,
//         marginBottom: 20,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//     },
//     profileHeader: {
//         alignItems: 'center',
//         marginBottom: 20,
//     },
//     profileImagePlaceholder: {
//         width: 100,  // Set fixed width
//         height: 100, // Set fixed height
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 12,
//         backgroundColor: '#EBF0F5',
//         borderRadius: 50,
//         overflow: 'hidden', // This ensures the square image is clipped to the circle
//     },
//     realProfileImage: {
//         width: '100%',
//         height: '100%',
//         resizeMode: 'cover',
//     },
//     profileName: {
//         fontSize: 20,
//         fontWeight: '700',
//         color: '#1a2f5a',
//         marginBottom: 4,
//     },
//     badge: {
//         fontSize: 10,
//         fontWeight: '600',
//         color: '#fff',
//         backgroundColor: '#00A8FF', 
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 4,
//         textTransform: 'uppercase'
//     },
//     profileDetail: {
//         fontSize: 13,
//         color: '#666',
//         marginTop: 5,
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 5,
//     },
//     profileBio: {
//         fontSize: 13,
//         color: '#666',
//         marginTop: 10,
//         textAlign: 'center',
//         lineHeight: 18,
//     },
//     statsContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         backgroundColor: '#EBF0F5',
//         borderRadius: 12,
//         paddingVertical: 12,
//         marginBottom: 20,
//     },
//     statItem: {
//         alignItems: 'center',
//     },
//     statNumber: {
//         fontSize: 16,
//         fontWeight: '700',
//         color: '#1a2f5a',
//         marginTop: 4,
//     },
//     statLabel: {
//         fontSize: 11,
//         color: '#666',
//         marginTop: 2,
//     },
//     recentToursSection: {
//         marginBottom: 20,
//     },
//     sectionTitle: {
//         fontSize: 14,
//         fontWeight: '700',
//         color: '#1a2f5a',
//         marginBottom: 12,
//         marginLeft: 4,
//     },
//     tourItem: {
//         flexDirection: 'row',
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         padding: 12,
//         marginBottom: 10,
//         alignItems: 'flex-start',
//         borderWidth: 1,
//         borderColor: '#E0E6ED'
//     },
//     tourIcon: {
//         marginRight: 12,
//         marginTop: 4,
//     },
//     tourInfo: {
//         flex: 1,
//     },
//     tourTitle: {
//         fontSize: 13,
//         fontWeight: '600',
//         color: '#1a2f5a',
//         marginBottom: 2,
//     },
//     tourDetails: {
//         fontSize: 11,
//         color: '#666',
//         marginBottom: 2,
//     },
//     tourDate: {
//         fontSize: 10,
//         color: '#999',
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 2,
//     },
//     ratingNumber: {
//         fontSize: 11,
//         fontWeight: '600',
//         color: '#1a2f5a',
//         marginLeft: 4,
//     },
//     settingsSection: {
//         marginBottom: 20,
//     },
//     settingItem: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         paddingVertical: 12,
//         paddingHorizontal: 14,
//         marginBottom: 8,
//         borderWidth: 1,
//         borderColor: '#E0E6ED'
//     },
//     settingLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//     },
//     settingLabel: {
//         fontSize: 13,
//         fontWeight: '500',
//         color: '#1a2f5a',
//     },
//     notification: {
//         width: 24,
//         height: 24,
//         borderRadius: 12,
//         backgroundColor: '#ff4444',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     notificationText: {
//         fontSize: 12,
//         fontWeight: '700',
//         color: '#fff',
//     },
//     buttonContainer: {
//         flexDirection: 'row', // Layout horizontally
//         justifyContent: 'space-between',
//         gap: 12,
//         paddingHorizontal: 4,
//         paddingBottom: 20
//     },
//     editButton: {
//         flex: 2, // Takes up 2/3 of the space (Main Action)
//         backgroundColor: '#00A8FF',
//         borderRadius: 12,
//         paddingVertical: 15,
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     buttonText: {
//         fontSize: 13,
//         fontWeight: '600',
//         color: '#fff',
//     },
//     logoutButton: {
//         flex: 1, // Takes up 1/3 of the space (Secondary Action)
//         backgroundColor: '#FF5A5F', 
//         borderRadius: 12,
//         paddingVertical: 15,
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     logoutButtonText: {
//         fontSize: 13,
//         fontWeight: '600',
//         color: '#fff',
//     },
// });
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, StatusBar, Image, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/api";

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const { user, logout, refreshUser } = useAuth(); // Import refreshUser
    const params = useLocalSearchParams();
    const userId = params.userId;
    const [profile, setProfile] = useState(null);
    const router = useRouter();

    // FIXED: Use useFocusEffect to force refresh when screen comes into view
    // This solves the issue of seeing old data after relogin
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                
                // If viewing another user
                if (userId) {
                    try {
                        const response = await api.get(`/api/guides/${userId}/`);
                        setProfile(response.data);
                    } catch (error) {
                        console.error("Failed to fetch profile:", error);
                    }
                } 
                // If viewing own profile
                else {
                    // Ensure we have the latest user data from context
                    // Optional: You can await refreshUser() here if you want to hit API every time
                    setProfile(user); 
                }
                
                setLoading(false);
            };

            loadData();
        }, [userId, user]) // specific dependencies
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // Safety check if profile is null after loading
    if (!profile) {
         return (
            <View style={styles.centerContainer}>
                <Text>Profile not found.</Text>
            </View>
        );
    }

    const isOwnProfile = !userId || (user && profile && user.id === profile.id);
    const isGuide = profile.is_local_guide && profile.guide_approved;
    // const isTourist = profile.is_tourist; // Unused variable warning fix

    const profileData = {
        name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.username || "User",
        image: profile.profile_picture || null, 
        recentTours: [
            { id: 1, title: "Historic City Walking Tour", rating: 5, guide: "Guide Joshua Jameson", date: "Oct 15, 2025" },
            { id: 2, title: "Mountain Hiking", rating: 3, guide: "Guide Frank Sabastine", date: "Sept 20, 2025" }
        ],
        stats: isGuide ? { tours: 12, completions: 50, rating: 4.8 } : null
    };

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

                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        
                        <View style={styles.profileImagePlaceholder}>
                            {profileData.image ? (
                                <Image 
                                    source={{ uri: profileData.image }} 
                                    style={styles.realProfileImage} 
                                />
                            ) : (
                                <Ionicons name="person-circle-outline" size={80} color="#1a2f5a" />
                            )}
                        </View>

                        <Text style={styles.profileName}>{profileData.name}</Text>
                        {
                            isGuide ? (
                                <Text style={styles.badge}>Tourist / Local Guide</Text>
                            ) : (
                                <Text style={styles.badge}>Tourist</Text>
                            )
                        }

                        {profile.phone_number && (
                            <Text style={styles.profileDetail}>
                                <Ionicons name="call-outline" size={14} color="#666" /> {profile.phone_number}
                            </Text>
                        )}
                        {profile.location && (
                            <Text style={styles.profileDetail}>
                                <Ionicons name="location-outline" size={14} color="#666" /> {profile.location}
                            </Text>
                        )}
                        {profile.bio && (
                            <Text style={styles.profileBio}>{profile.bio}</Text>
                        )}
                    </View>

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
                    
                    {isOwnProfile && (
                        <View style={styles.settingsSection}>
                            <Text style={styles.sectionTitle}>Account Settings</Text>
                            {(isGuide ? guideSettingsItems : touristSettingsItems).map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.settingItem}
                                    onPress={() => {
                                        if (item.label === 'View Accommodations') {
                                            router.push(`/(protected)/viewAccommodations?userId=${profile.id}`);
                                            return;
                                        }
                                    }}
                                >
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
                    )}

                    {isOwnProfile && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => router.push('/profile/edit_profile')}
                            >
                                <Ionicons name="create-outline" size={18} color="#fff" style={{marginRight: 5}} />
                                <Text style={styles.buttonText}>Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.logoutButton} 
                                onPress={async () => {
                                    // Make sure logout completes
                                    await logout();
                                }}
                            >
                                <Ionicons name="log-out-outline" size={18} color="#fff" style={{marginRight: 5}} />
                                <Text style={styles.logoutButtonText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', 
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
        marginHorizontal: 16,
        marginTop: 30,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImagePlaceholder: {
        width: 100,  
        height: 100, 
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        backgroundColor: '#EBF0F5',
        borderRadius: 50,
        overflow: 'hidden', 
    },
    realProfileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
        backgroundColor: '#00A8FF', 
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        textTransform: 'uppercase'
    },
    profileDetail: {
        fontSize: 13,
        color: '#666',
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    profileBio: {
        fontSize: 13,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 18,
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
        flexDirection: 'row', 
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 4,
        paddingBottom: 20
    },
    editButton: {
        flex: 2, 
        backgroundColor: '#00A8FF',
        borderRadius: 12,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    logoutButton: {
        flex: 1, 
        backgroundColor: '#FF5A5F', 
        borderRadius: 12,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
});

export default Profile