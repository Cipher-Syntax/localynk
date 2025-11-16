import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../api/api'; // Assuming correct path to your API utility

const Notifications = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const notificationIcons = {
        // Mapped to alert titles/types from the backend if possible, or object context
        "New Guide Application": <Ionicons name="person-add-outline" size={28} color="#F5A623" />,
        "Application Approved!": <Ionicons name="checkmark-done-circle-outline" size={28} color="#007AFF" />,
        "Booking Accepted!": <Ionicons name="calendar-outline" size={28} color="#0A2342" />,
        "New Message": <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0A2342" />,
        "Payment Successful": <FontAwesome5 name="money-check-alt" size={24} color="#0A2342" />,
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/alerts/');
            // response.data should contain a list of SystemAlert objects
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error.response?.data || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            // Call the backend to mark this specific alert as read
            await api.patch(`/api/alerts/${id}/read/`, { is_read: true });
            
            // Optimistically update the local state to remove the red dot
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error.response?.data || error.message);
        }
    };

    const handleNotificationPress = (item) => {
        markAsRead(item.id);

        if (item.title === "Application Approved!") {
            // Use the notification's related_object_id or a fixed fee
            // For now, we use a fixed mock fee, but you could pass actual fee data from the alert here.
            router.push({pathname: '/(protected)/completeRegistrationFee', params: {feeAmount: '500.00'}});
        } else if (item.title === "Booking Accepted!") {
            // Uses the generic booking ID
            router.push(`/(protected)/completePayment?bookingId=${item.related_object_id || 'booking789'}`);
        } else if (item.title === "New Message") {
            router.push('/(protected)/message');
        } else {
            // Fallback action or view specific detail
            console.log('Viewing notification detail:', item);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const categorizeNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayList = [];
        const weekList = [];

        notifications.forEach(item => {
            const itemDate = new Date(item.created_at);
            const timeDiff = today.getTime() - itemDate.getTime();
            const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            // Use the hardcoded mock notifications for display until backend is fully integrated
            // For now, we mock the data structure to include the necessary fields.
            const displayItem = {
                id: item.id,
                icon: notificationIcons[item.title] || <Ionicons name="information-circle-outline" size={28} color="#0A2342" />,
                title: item.title,
                description: item.message, // Use message as description
                time: `${diffDays === 0 ? 'Today' : diffDays + ' days ago'}`, // Simplified time
                is_read: item.is_read,
                action: () => handleNotificationPress(item),
            };

            if (diffDays === 0) {
                todayList.push(displayItem);
            } else if (diffDays < 7) {
                weekList.push(displayItem);
            }
        });

        return { today: todayList, week: weekList };
    };

    const { today: todayNotifications, week: weekNotifications } = categorizeNotifications();

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
            {!item.is_read && <View style={styles.redDot} />}
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#007AFF' }}>Loading notifications...</Text>
            </View>
        );
    }

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

            {/* Today's Notifications */}
            {todayNotifications.length > 0 && (
                <>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>TODAY</Text>
                        <TouchableOpacity onPress={() => console.log('Mark all read action placeholder')}>
                            <Text style={styles.markAll}>Mark all read</Text>
                        </TouchableOpacity>
                    </View>
                    {todayNotifications.map(renderNotification)}
                </>
            )}

            {/* This Week's Notifications */}
            {weekNotifications.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>THIS WEEK</Text>
                    {weekNotifications.map(renderNotification)}
                </>
            )}

            {/* No Notifications State */}
            {todayNotifications.length === 0 && weekNotifications.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>You're all caught up! No new notifications.</Text>
                </View>
            )}
        </ScrollView>
    );
};


export default Notifications;

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F8FB',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
        minHeight: 200,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#8B98A8',
        textAlign: 'center',
    },
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
        marginRight: 20,
        marginTop: 10
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