import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
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
        "New Guide Application": <Ionicons name="person-add-outline" size={28} color="#F5A623" />,
        "Application Approved!": <Ionicons name="checkmark-done-circle-outline" size={28} color="#007AFF" />,
        "Booking Accepted!": <Ionicons name="calendar-outline" size={28} color="#28A745" />,
        "New Booking Request": <Ionicons name="calendar-number-outline" size={28} color="#FF9500" />,
        "New Message": <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0A2342" />,
        "Payment Successful": <FontAwesome5 name="money-check-alt" size={24} color="#007AFF" />,
        "Application Submitted": <Ionicons name="time-outline" size={28} color="#8E8E93" />,
        "How was your trip?": <Ionicons name="star-outline" size={28} color="#FF8C00" />,
        "You have a new review!": <Ionicons name="star-half-outline" size={28} color="#007AFF" />,
        
        // 🔥 UPDATED: Added "Content Warning" to match the Backend
        "Content Warning": <FontAwesome5 name="exclamation-triangle" size={24} color="#FF3B30" />, 
        "Warning from Admin": <FontAwesome5 name="exclamation-triangle" size={24} color="#FFA500" />,
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/alerts/');
            if (response.data) {
                const sortedData = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setNotifications(sortedData);
            }
        } catch (error) {
            console.error('Backend notifications fetch failed:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

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
            await api.patch(`/api/alerts/${id}/read/`, { is_read: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        const unreadItems = notifications.filter(n => !n.is_read);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await Promise.all(unreadItems.map(item => api.patch(`/api/alerts/${item.id}/read/`, { is_read: true })));
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleNotificationPress = async (item) => {
        if (!item.is_read) {
            markAsRead(item.id);
        }

        console.log(`DEBUG: Tapped notification. Title: "${item.title}"`);

        if (item.title === "How was your trip?") {
            router.push({
                pathname: '/(protected)/reviewModal',
                params: { bookingId: item.related_object_id }
            });
        }
        else if (item.title === "You have a new review!") {
            router.push('/(protected)/myReviews');
        }
        else if (item.title === "Application Approved!") {
            router.push('/(protected)/home/tourGuide');
        } 
        else if (item.title === "New Booking Request") {
            router.push('/(protected)/home/tourGuide');
        }
        else if (item.title === "Booking Accepted!") {
            try {
                const response = await api.get(`/api/bookings/${item.related_object_id}/`);
                const booking = response.data;
                const isAgency = !!booking.agency;
                const entityDetail = isAgency ? booking.agency_detail : booking.guide_detail;
                const assignedGuides = booking.assigned_guides_detail || []; 

                router.push({
                    pathname: '/(protected)/payment',
                    params: {
                        bookingId: booking.id,
                        entityId: entityDetail.id,
                        entityName: entityDetail.full_name || entityDetail.username || (isAgency ? "Selected Agency" : "Your Guide"),
                        bookingType: isAgency ? 'agency' : 'guide',
                        assignedGuides: JSON.stringify(assignedGuides),
                        basePrice: booking.total_price || 1000, 
                        placeName: "Your Adventure", 
                        checkInDate: booking.check_in, 
                        checkOutDate: booking.check_out, 
                        numGuests: booking.num_guests, 
                    }
                });
            } catch (error) {
                console.error("Failed to load booking details:", error);
                Alert.alert("Error", "Could not load booking details.");
            }
        } 
        else if (item.title === "New Message") {
            const partnerId = item.related_object_id;
            const partnerName = item.message.includes('from ') ? item.message.split('from ')[1] : "User";
            router.push({
                pathname: '/(protected)/message',
                params: { partnerId, partnerName }
            });
        } 
        // 🔥 UPDATED: Handle "Content Warning" specifically
        else if (item.title === "Content Warning" || item.title === "Warning from Admin") {
            Alert.alert("⚠️ Administrative Warning", item.message);
        }
        else if (item.title === "Application Submitted") {
            Alert.alert(item.title, item.message);
        }
        else {
            // Generic Fallback
            Alert.alert(item.title, item.message);
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
                ...item,
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
        <TouchableOpacity style={styles.notificationCard} key={item.id} onPress={item.action}>
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View>
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                </View>
            </View>
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {notifications.some(n => !n.is_read) && (
                    <View style={styles.actionHeader}>
                         <TouchableOpacity onPress={handleMarkAllRead}>
                            <Text style={styles.markAll}>Mark all read</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {todayNotifications.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>TODAY</Text></View>
                        {todayNotifications.map(renderNotification)}
                    </>
                )}
                {weekNotifications.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>THIS WEEK</Text>
                        {weekNotifications.map(renderNotification)}
                    </>
                )}
                {notifications.length === 0 && (
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FB' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 50, marginTop: 50 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#8B98A8', textAlign: 'center' },
    container: { flex: 1, backgroundColor: '#F5F8FB' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    actionHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginTop: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    sectionTitle: { fontWeight: '700', fontSize: 16, color: '#0A2342', marginHorizontal: 20, marginTop: 10 },
    markAll: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
    notificationCard: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 20, marginVertical: 8, padding: 15, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2, position: 'relative' },
    iconContainer: { marginRight: 10, marginTop: 4 },
    textContainer: { flex: 1, marginRight: 10 },
    notificationTitle: { fontWeight: '700', color: '#0A2342', fontSize: 14 },
    notificationDesc: { fontSize: 13, color: '#555', marginTop: 2 },
    notificationTime: { fontSize: 12, color: '#777', marginTop: 4 },
    redDot: { width: 10, height: 10, backgroundColor: '#FF3B30', borderRadius: 5, position: 'absolute', top: 10, right: 10 },
});