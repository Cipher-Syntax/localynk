import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const IsTourist = () => {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- NEW: Availability Status State ---
    const [isGuideActive, setIsGuideActive] = useState(false); // Default Inactive

    // --- 1. Fetch Data (Bookings & Profile Status) ---
    const fetchData = async () => {
        try {
            // Fetch Bookings
            const bookingRes = await api.get('/api/bookings/');
            setBookings(bookingRes.data);

            // Fetch Profile to get current "Active" status
            const profileRes = await api.get('api/profile/');
            // Assuming your backend has an 'is_guide_visible' boolean on the profile
            setIsGuideActive(profileRes.data.is_guide_visible || false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    // --- 2. Toggle Active Status ---
    const toggleActiveStatus = async () => {
        // 1. Optimistic Update (Change UI immediately)
        const newStatus = !isGuideActive;
        setIsGuideActive(newStatus);

        try {
            // 2. Send to Backend 
            await api.patch('api/guide/update-info/', { is_guide_visible: newStatus });
            
            if (newStatus) {
                Alert.alert("You are Online!", "Tourists can now see your profile and bookings.");
            } else {
                Alert.alert("You are Offline", "Your profile is hidden from search results.");
            }
        } catch (error) {
            // Revert if failed
            setIsGuideActive(!newStatus);
            Alert.alert("Error", "Failed to update status. Please check your internet.");
        }
    };

    const handleDecision = async (id, decision) => {
        try {
            const newStatus = decision === 'accept' ? 'Accepted' : 'Declined';
            await api.patch(`/api/bookings/${id}/status/`, { status: newStatus });
            fetchData();
        } catch (error) {
            console.error(`Failed to ${decision} booking:`, error);
            Alert.alert('Error', `Failed to ${decision} booking.`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>TOUR GUIDES DASHBOARD</Text>
                </View>

                <View style={styles.mainContent}>

                    {/* --- STATUS TOGGLE (UPDATED) --- */}
                    <View style={styles.statusToggleContainer}>
                        <View style={styles.statusTextContainer}>
                            {/* UPDATED: Specific Text Requested */}
                            <Text style={styles.readyPromptText}>
                                {isGuideActive ? "You are currently active" : "Are you ready to be a local guide?"}
                            </Text>

                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: isGuideActive ? '#00c853' : '#ff5252' }]} />
                                <Text style={[styles.statusLabel, { color: isGuideActive ? '#00c853' : '#ff5252' }]}>
                                    {isGuideActive ? 'ONLINE' : 'OFFLINE'}
                                </Text>
                            </View>
                            
                            <Text style={styles.statusSubLabel}>
                                {isGuideActive 
                                    ? "Visible to tourists." 
                                    : "Hidden from bookings."}
                            </Text>
                        </View>
                        
                        <Switch
                            trackColor={{ false: "#e0e0e0", true: "#b9f6ca" }}
                            thumbColor={isGuideActive ? "#00c853" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleActiveStatus}
                            value={isGuideActive}
                        />
                    </View>

                    {/* --- STATS CARDS --- */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>127</Text>
                            <Text style={styles.statLabel}>Total Bookings</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{bookings.length}</Text>
                            <Text style={styles.statLabel}>Bookings</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>15</Text>
                            <Text style={styles.statLabel}>Completed Tours</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>4.8</Text>
                            <Text style={styles.statLabel}>Average Rating</Text>
                        </View>
                    </View>

                    {/* --- ACTION BUTTONS & BOOKINGS --- */}
                    <View style={styles.bookingsSection}>
                        
                        {/* ACTIONS HEADER */}
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                            <Text style={styles.bookingsTitle}>QUICK ACTIONS</Text>
                            
                            {/* UPDATE INFO BUTTON (Always visible) */}
                            <TouchableOpacity 
                                style={styles.updateInfo}
                                onPress={() => router.push({pathname: "/(protected)/UpdateGuideInfoForm"})}
                            >
                                <Text style={styles.updateInfoBtnText}>Update Info</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CREATION BUTTONS ROW */}
                        <View style={styles.creationButtonsRow}>
                            <TouchableOpacity 
                                style={styles.addAccommodationBtn}
                                onPress={() => router.push({pathname: "/(protected)/addAccommodation"})}
                            >
                                <Ionicons name="bed-outline" size={16} color="#fff" style={{marginRight: 6}} />
                                <Text style={styles.addAccommodationBtnText}>Add Accommodation</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.addTourBtn}
                                onPress={() => router.push({pathname: "/(protected)/addTour"})}
                            >
                                <Ionicons name="map-outline" size={16} color="#fff" style={{marginRight: 6}} />
                                <Text style={styles.addTourBtnText}>Add Tour</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.action}>
                            <Text style={styles.bookingsTitle}>BOOKINGS</Text>
                        </View>

                        {/* BOOKING LIST */}
                        {bookings.map((booking) => (
                            <View key={booking.id} style={styles.bookingCard}>
                                <View style={styles.bookingHeader}>
                                    <View style={styles.avatarContainer}>
                                        <View style={styles.avatar} />
                                    </View>
                                    <View style={styles.bookingInfo}>
                                        <View style={styles.nameStatusRow}>
                                            <Text style={styles.guideNameWaiting}>{booking.tourist_username}</Text>
                                            
                                            {booking.status === 'Pending' && <Ionicons name="hourglass-outline" size={16} color="#ffb74d" />}
                                            {booking.status === 'Accepted' && <Ionicons name="checkmark-circle-outline" size={16} color="#00c853" />}
                                            {booking.status === 'Active' && <Ionicons name="radio-button-on-outline" size={16} color="#29b6f6" />}
                                            {booking.status === 'Declined' && <Ionicons name="close-circle-outline" size={16} color="#ff5252" />}
                                        </View>
                                        
                                        <View style={styles.statusContainer}>
                                            <Text style={styles.statusText}>{booking.status}</Text>
                                        </View>

                                        <View style={styles.metaInfo}>
                                            <View style={styles.dates}>
                                                <Ionicons name="calendar-outline" size={12} color="#ccc" />
                                                <Text style={styles.startDate}>{booking.check_in}</Text>
                                                <Text style={{color: '#ccc', fontSize: 10}}> - </Text>
                                                <Text style={styles.endDate}>{booking.check_out}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* ACTIONS (Accept/Decline) */}
                                {booking.status === 'Pending' && (
                                    <View style={styles.decisionRow}>
                                        <TouchableOpacity 
                                            style={[styles.decisionButton, styles.rejectButton]}
                                            onPress={() => handleDecision(booking.id, 'decline')}
                                        >
                                            <Ionicons name="close" size={16} color="#fff" />
                                            <Text style={styles.decisionText}>Decline</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.decisionButton, styles.acceptButton]}
                                            onPress={() => handleDecision(booking.id, 'accept')}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                            <Text style={styles.decisionText}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.messageButton}>
                                    <Text style={styles.messageButtonText}>Message Client</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default IsTourist;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f8f9fa' 
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center'
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
    mainContent: {
        flexDirection: "column",
        gap: 20
    },
    // --- UPDATED STATUS TOGGLE STYLES ---
    statusToggleContainer: {
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 15,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    statusTextContainer: {
        flex: 1,
    },
    readyPromptText: {
        fontSize: 12,
        color: '#8B98A8',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        gap: 6
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    statusSubLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    // --- STATS ---
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        gap: 10,
        marginTop: 5,
        marginBottom: 100
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        // Shadow
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff'
    },
    statLabel: {
        fontSize: 12,
        color: '#B0B8C4',
        marginTop: 4,
        fontWeight: '500'
    },
    bookingsSection: {
        padding: 15,
    },
    action: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
    },
    bookingsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#253347',
        letterSpacing: 0.5,
    },
    // --- UPDATED BUTTON STYLES ---
    creationButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5
    },
    addAccommodationBtn: {
        flex: 1,
        backgroundColor: '#0072FF',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addAccommodationBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },
    addTourBtn: {
        flex: 1,
        backgroundColor: '#00C6FF',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addTourBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },
    updateInfo: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#253347'
    },
    updateInfoBtnText: {
        color: '#253347',
        fontWeight: '700',
        fontSize: 11,
        textAlign: "center",
    },
    // Booking Card Styles
    bookingCard: {
        backgroundColor: '#253347',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    avatarContainer: {
        marginRight: 12
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3E4C5E',
        borderWidth: 2,
        borderColor: '#0072FF'
    },
    bookingInfo: {
        flex: 1
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6
    },
    guideNameWaiting: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    },
    statusText: {
        fontSize: 12,
        color: '#B0B8C4',
        fontWeight: '500'
    },
    metaInfo: {
        flexDirection: 'column',
    },
    dates: {
        flexDirection: "row",
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6
    },
    startDate: { fontSize: 11, color: '#fff', fontWeight: '600' },
    endDate: { fontSize: 11, color: '#fff', fontWeight: '600' },
    
    decisionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10
    },
    decisionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 10,
        flex: 1,
    },
    acceptButton: { backgroundColor: '#00c853' },
    rejectButton: { backgroundColor: '#ff5252' },
    decisionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 6,
    },
    messageButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    messageButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700'
    },
});