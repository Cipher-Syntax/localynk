import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../api/api'; 

const Notifications = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const notificationIcons = {
        // Matches the "title" we set in the Django Signal
        "New Guide Application": <Ionicons name="person-add-outline" size={28} color="#F5A623" />,
        "Application Approved!": <Ionicons name="checkmark-done-circle-outline" size={28} color="#007AFF" />,
        "Booking Accepted!": <Ionicons name="calendar-outline" size={28} color="#28A745" />,
        "New Message": <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0A2342" />,
        "Payment Successful": <FontAwesome5 name="money-check-alt" size={24} color="#007AFF" />,
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/alerts/');
            if (response.data) {
                // Sort by created_at desc (newest first) just in case backend doesn't
                const sortedData = response.data.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setNotifications(sortedData);
            }
        } catch (error) {
            console.warn('Backend notifications fetch failed:', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Use useFocusEffect to auto-refresh the list whenever the screen appears
    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            // Call backend to mark as read
            await api.patch(`/api/alerts/${id}/read/`, { is_read: true });
            
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        // Filter only unread items to save API calls
        const unreadItems = notifications.filter(n => !n.is_read);
        
        // Optimistically update UI immediately
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        // Send requests in background
        try {
            await Promise.all(unreadItems.map(item => 
                api.patch(`/api/alerts/${item.id}/read/`, { is_read: true })
            ));
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleNotificationPress = (item) => {
        // 1. Mark as read immediately
        if (!item.is_read) {
            markAsRead(item.id);
        }

        // 2. Handle Navigation based on Title
        if (item.title === "Application Approved!") {
            router.push({
                pathname: '/(protected)/completeRegistrationFee', 
                params: { feeAmount: item.booking_total_price || '500.00' }
            });
        } 
        else if (item.title === "Booking Accepted!") {
            const confirmedBookingData = {
                bookingId: item.related_object_id,
                totalPrice: item.booking_total_price, 
                guideName: item.assigned_guide_name, 
            };
            router.push({ 
                pathname: '/(protected)/agencyAssignedGuide', 
                params: confirmedBookingData
            });
        } 
        else if (item.title === "New Message") {
            // Navigate to your messages screen
            // If your Message screen supports opening a specific chat via params, add it here using item.related_object_id
            router.push('/(protected)/message'); 
        } 
        else {
            console.log('Generic notification pressed:', item);
        }
    };

    const categorizeNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayList = [];
        const weekList = [];

        notifications.forEach(item => {
            const itemDate = new Date(item.created_at);
            const timeDiff = today.getTime() - itemDate.getTime();
            const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            const displayItem = {
                ...item, // Keep all original properties
                icon: notificationIcons[item.title] || <Ionicons name="information-circle-outline" size={28} color="#0A2342" />,
                description: item.message, 
                time: `${diffDays <= 0 ? 'Today' : diffDays + ' days ago'}`, 
                action: () => handleNotificationPress(item),
            };

            if (diffDays <= 0) {
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
                <Text style={styles.notificationDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
            {!item.is_read && <View style={styles.redDot} />}
        </TouchableOpacity>
    );

    if (isLoading && notifications.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#007AFF' }}>Loading notifications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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

            <ScrollView 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Mark All Read Button - Only show if there are unread items */}
                {notifications.some(n => !n.is_read) && (
                    <View style={styles.actionHeader}>
                         <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.markAll}>Mark all read</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Today's Notifications */}
                {todayNotifications.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>TODAY</Text>
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
        </View>
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
        marginTop: 50,
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
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        marginTop: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10, // Reduced top margin slightly
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
        marginRight: 10, // Space for red dot
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