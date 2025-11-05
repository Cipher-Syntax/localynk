import React from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar, ScrollView, } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Notifications = () => {
    const router = useRouter();
    const todayNotifications = [
        {
            id: "msg123",
            icon: <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0A2342" />,
            title: "New Message",
            description: "Juan Dela Cruz: ‘Looking forward to our tour tomorrow! I’ll meet you at the hotel lobby.’",
            time: "3 hours ago",
            action: () => router.push('/(protected)/message'),
        },
        {
            id: "booking789",
            icon: <Ionicons name="calendar-outline" size={28} color="#0A2342" />,
            title: "Booking Accepted!",
            description: "Your tour with Juan Dela Cruz is accepted. Complete your payment to confirm.",
            time: "4 hours ago",
            action: () => router.push(`/(protected)/completePayment?bookingId=booking789`),
        },
    ];

    const weekNotifications = [
        {
            id: "payment1",
            icon: <FontAwesome5 name="money-check-alt" size={24} color="#0A2342" />,
            title: "Payment Successful",
            description: "Payment of ₱1,500 for City Heritage Tour has been processed successfully.",
            time: "3 days ago",
            action: () => router.push('/(protected)/bookings/payment1'),
        },
    ];

    const renderNotification = (item) => (
        <TouchableOpacity 
            style={styles.notificationCard} 
            key={item.id} 
            onPress={item.action}
        >
            <View style={styles.iconContainer}>{item.icon}</View>
                <View style={styles.textContainer}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationDesc}>{item.description}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
            <View style={styles.redDot} />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TODAY</Text>
                <TouchableOpacity>
                    <Text style={styles.markAll}>Mark all read</Text>
                </TouchableOpacity>
            </View>
            {todayNotifications.map(renderNotification)}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>THIS WEEK</Text>
            {weekNotifications.map(renderNotification)}
        </ScrollView>
    );
};


export default Notifications;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8FB',
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 16,
        color: '#0A2342',
        marginHorizontal: 20,
        marginTop: 10,
    },
    markAll: {
        color: '#007AFF',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    iconContainer: {
        marginRight: 10,
        marginTop: 4,
    },
    textContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontWeight: '700',
        color: '#0A2342',
        fontSize: 14,
    },
    notificationDesc: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
    },
    notificationTime: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    redDot: {
        width: 10,
        height: 10,
        backgroundColor: '#FF3B30',
        borderRadius: 5,
        position: 'absolute',
        top: 10,
        right: 10,
    },
});
