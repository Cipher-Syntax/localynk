import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const IsTourist = () => {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/api/bookings/');
            console.log("Related Booking To You: ", response.data);
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            Alert.alert('Error', 'Failed to fetch bookings.');
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleDecision = async (id, decision) => {
        try {
            // console.log("User ID:", api.defaults.headers.common['Authorization']); // Log the auth token to see if user is authenticated
            // console.log("Booking ID:", id);
            const newStatus = decision === 'accept' ? 'Accepted' : 'Declined';
            await api.patch(`/api/bookings/${id}/status/`, { status: newStatus });
            fetchBookings(); // Refetch bookings to update the list
        } catch (error) {
            console.error(`Failed to ${decision} booking:`, error);
            Alert.alert('Error', `Failed to ${decision} booking.`);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>TOUR GUIDES</Text>
                </View>

                <View style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 100
                }}>
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
                            <Text style={styles.statNumber}>
                                4.8 <Ionicons name="star" size={20} color="#ffc107" />
                            </Text>
                            <Text style={styles.statLabel}>Average Rating</Text>
                        </View>
                    </View>

                    <View style={[styles.bookingsSection, { width: "100%" }]}>
                        <View style={styles.action}>
                            <Text style={styles.bookingsTitle}>BOOKINGS</Text>
                            <View style={{ alignItems: "center", justifyContent: "space-between", flexDirection: "row", gap: 7}}>
                                <TouchableOpacity style={styles.addTourBtn}>
                                    <Text style={styles.addTourBtnText} onPress={() => router.push({pathname: "/(protected)/addTour"})}>Add Tour</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addAccommodationBtn} onPress={() => router.push({pathname: "/(protected)/addAccommodation"})}>
                                    <Text style={styles.addAccommodationBtnText}>Add Accommodation</Text>
                                </TouchableOpacity>
                                
                            </View>
                        </View>
                            <TouchableOpacity style={styles.updateInfo} onPress={() => router.push({pathname: "/(protected)/UpdateGuideInfoForm"})}>
                                <Text style={styles.updateInfoBtnText}>Update Info</Text>
                            </TouchableOpacity>

                        {bookings.map((booking) => (
                            <View key={booking.id} style={styles.bookingCard}>
                                <View style={styles.bookingHeader}>
                                    <View style={styles.avatarContainer}>
                                        <View style={styles.avatar} />
                                    </View>
                                    <View style={styles.bookingInfo}>
                                        <View style={styles.nameStatusRow}>
                                            <Text style={styles.guideNameWaiting}>{booking.tourist_username}</Text>
                                            <View style={styles.statusContainer}>
                                                {booking.status === 'Pending' && (
                                                    <Ionicons name="time-outline" size={16} color="#ffc107" />
                                                )}

                                                {booking.status === 'Accepted' && (
                                                    <Ionicons name="checkmark" size={16} color="#0099ff" />
                                                )}
                                                {booking.status === 'Active' && (
                                                    <Ionicons name="checkmark-circle-outline" size={16} color="#00c853" />
                                                )}
                                                {booking.status === 'Declined' && (
                                                    <Ionicons name="close-circle-outline" size={16} color="#ff5252" />
                                                )}
                                                <Text style={styles.statusText}>{booking.status}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaInfo}>
                                            
                                            <View style={styles.dates}>
                                                <Text style={styles.startDate}>
                                                    <Ionicons name="calendar" size={16} color="#ffffff" /> {booking.check_in}
                                                </Text>
                                                <Text style={{color: "#fff", fontSize: 11 }}> - </Text>
                                                <Text style={styles.endDate}>
                                                    <Ionicons name="calendar" size={16} color="#ffffff" /> {booking.check_out}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {booking.status === 'Pending' && (
                                    <View style={styles.decisionRow}>
                                        <TouchableOpacity
                                            style={[styles.decisionButton, styles.rejectButton]}
                                            onPress={() => handleDecision(booking.id, 'decline')}
                                        >
                                            <Ionicons name="close" size={14} color="#fff" />
                                            <Text style={styles.decisionText}>Decline</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.decisionButton, styles.acceptButton]}
                                            onPress={() => handleDecision(booking.id, 'accept')}
                                        >
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                            <Text style={styles.decisionText}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.messageButton}>
                                    <Text style={styles.messageButtonText}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#ffffff" /> 
                                        Message Client
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

export default IsTourist;

// Your styles are unchanged
const styles = StyleSheet.create({
    container: { 
        flex: 1 
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
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
    },
    statNumber: { 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#fff' 
    },
    statLabel: { 
        fontSize: 12, 
        color: '#999', 
        marginTop: 4 
    },
    bookingsSection: { 
        padding: 15, 
    },
    action: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    addAccommodationBtn: {
        backgroundColor: '#0072FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
    },
    addAccommodationBtnText: { 
        color: '#fff', 
        fontWeight: '900' 
    },
    addTourBtn: {
        backgroundColor: '#0072FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
    },
    updateInfo: {
        backgroundColor: '#0072FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
        marginBottom: 20
    },
    updateInfoBtnText: { 
        color: '#fff', 
        fontWeight: '900', 
        textAlign: "center",
    },
    addTourBtn: {
        backgroundColor: '#0072FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
    },
    addTourBtnText: { 
        color: '#fff', 
        fontWeight: '900' 
    },
    bookingsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#253347',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    bookingCard: {
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    avatarContainer: { 
        position: 'relative', 
        marginRight: 12 
    },
    avatar: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#999' 
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00c853',
        borderWidth: 2,
        borderColor: '#253347',
    },
    bookingInfo: { 
        flex: 1 
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4 
    },
    guideNameWaiting: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#fff' 
    },
    statusText: { 
        fontSize: 12, 
        color: '#fff', 
        marginLeft: 4 
    },
    metaInfo: { 
        flexDirection: 'column', 
        marginTop: 6, 
        gap: 5 
    },
    dates: {
        flexDirection: "row",
        gap: 10
    },
    startDate: { 
        fontSize: 11, 
        color: '#fff' 
    },
    endDate: { 
        fontSize: 11, 
        color: '#fff' 
    },
    hopping: { 
        fontSize: 12, 
        color: '#fff' 
    },
    decisionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    decisionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
        flex: 1,
        marginHorizontal: 4,
    },
    acceptButton: { 
        backgroundColor: '#00c853' 
    },
    rejectButton: { 
        backgroundColor: '#ff5252' 
    },
    decisionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 6,
    },
    messageButton: {
        backgroundColor: '#0099ff',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    messageButtonText: { 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: '600' 
    },
});