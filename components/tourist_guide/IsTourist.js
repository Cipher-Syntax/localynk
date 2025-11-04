import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const IsTourist = () => {
    const [bookings, setBookings] = useState([
        {
            id: 1,
            name: 'Francoise Minoville',
            status: 'Pending',
            hopping: "Beach Hopping",
            lastSeen: 'May 5, 2022',
            isOnline: true,
        },
        {
            id: 2,
            name: 'Justine Toang',
            status: 'Active',
            hopping: "Beach Hopping",
            lastSeen: 'May 5, 2022',
            isOnline: false,
        },
        {
            id: 3,
            name: 'Charles Gumende',
            status: 'Pending',
            hopping: "Beach Hopping",
            lastSeen: 'May 5, 2022',
            isOnline: false,
        },
    ]);

    return (
        <ScrollView style={styles.container}>
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

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>127</Text>
                    <Text style={styles.statLabel}>Total Bookings</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>3</Text>
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

            <View style={styles.bookingsSection}>
                <Text style={styles.bookingsTitle}>BOOKINGS</Text>

                {bookings.map((booking) => (
                    <View key={booking.id} style={styles.bookingCard}>
                        <View style={styles.bookingHeader}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar} />
                                {booking.isOnline && <View style={styles.onlineIndicator} />}
                            </View>
                            <View style={styles.bookingInfo}>
                           
                                <View style={styles.nameStatusRow}>
                                    <Text style={styles.guideNameWaiting}>{booking.name}</Text>
                                    <View style={styles.statusContainer}>
                                        {booking.status === 'Pending' && (
                                            <Ionicons name="time-outline" size={16} color="#ffc107" />
                                        )}
                                        {booking.status === 'Active' && (
                                            <Ionicons name="checkmark-circle-outline" size={16} color="#00c853" />
                                        )}
                                        <Text style={styles.statusText}>{booking.status}</Text>
                                    </View>
                                </View>
                                <View style={styles.metaInfo}>
                                    <Text style={styles.hopping}>{booking.hopping}</Text>
                                    <Text style={styles.lastSeen}><Ionicons name="calendar" size={16} color="#ffffff" /> {booking.lastSeen}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageButtonText}><Ionicons name="chatbubble-ellipses-outline" size={16} color="#ffffff" /> Message Client </Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default IsTourist;

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    bookingsSection: {
        padding: 15,
        marginTop: 100,
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
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#999',
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
        flex: 1,
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    guideNameWaiting: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    statusText: {
        fontSize: 12,
        color: '#fff',
        marginLeft: 4,
    },
    metaInfo: {
        flexDirection: 'column',
        marginTop: 6,
        gap: 5,
    },
    lastSeen: {
        fontSize: 11,
        color: '#fff',
    },
    hopping: {
        fontSize: 12,
        color: '#fff',
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
        fontWeight: '600',
    },
});
