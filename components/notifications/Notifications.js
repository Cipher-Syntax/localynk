import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import api from '../../api/api'; 
import { useAuth } from '../../context/AuthContext';
import Toast from '../Toast';

const PAGE_SIZE = 12;

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'messages', label: 'Messages' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'payments', label: 'Payments' },
];

const Notifications = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [undoState, setUndoState] = useState({ visible: false, items: [], message: '' });
    const [dialog, setDialog] = useState({
        visible: false,
        title: '',
        message: '',
        confirmText: null,
        cancelText: 'Close',
        destructive: false,
        onConfirm: null,
    });
    const undoTimerRef = useRef(null);

    const notificationIcons = {
        "New Guide Application": <Ionicons name="person-add-outline" size={28} color="#F5A623" />,
        "Application Approved!": <Ionicons name="checkmark-done-circle-outline" size={28} color="#007AFF" />,
        "Booking Accepted!": <Ionicons name="calendar-outline" size={28} color="#28A745" />,
        "New Booking Request": <Ionicons name="calendar-number-outline" size={28} color="#FF9500" />,
        "New Message": <Ionicons name="chatbubble-ellipses-outline" size={28} color="#0A2342" />,
        "Payment Successful": <FontAwesome5 name="money-check-alt" size={24} color="#007AFF" />,
        "Refund Request Submitted": <Ionicons name="return-down-back-outline" size={28} color="#0F766E" />,
        "Refund Requested": <Ionicons name="return-down-back-outline" size={28} color="#0F766E" />,
        "Refund Under Review": <Ionicons name="time-outline" size={28} color="#1D4ED8" />,
        "Refund Approved": <Ionicons name="checkmark-circle-outline" size={28} color="#16A34A" />,
        "Refund Rejected": <Ionicons name="close-circle-outline" size={28} color="#DC2626" />,
        "Refund Completed": <Ionicons name="cash-outline" size={28} color="#0F766E" />,
        "New Refund Request": <Ionicons name="alert-circle-outline" size={28} color="#F97316" />,
        "Application Submitted": <Ionicons name="time-outline" size={28} color="#8E8E93" />,
        "How was your trip?": <Ionicons name="star-outline" size={28} color="#FF8C00" />,
        "You have a new review!": <Ionicons name="star-half-outline" size={28} color="#007AFF" />,
        
        "Content Warning": <FontAwesome5 name="exclamation-triangle" size={24} color="#FF3B30" />, 
        "Warning from Admin": <FontAwesome5 name="exclamation-triangle" size={24} color="#FFA500" />,
    };

    const showToast = useCallback((message, type = 'success') => {
        setToast({ visible: true, message, type });
    }, []);

    const closeDialog = useCallback(() => {
        setDialog(prev => ({ ...prev, visible: false, onConfirm: null }));
    }, []);

    const openInfoDialog = useCallback((title, message) => {
        setDialog({
            visible: true,
            title,
            message,
            confirmText: null,
            cancelText: 'Close',
            destructive: false,
            onConfirm: null,
        });
    }, []);

    const openConfirmDialog = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', destructive = false, onConfirm }) => {
        setDialog({
            visible: true,
            title,
            message,
            confirmText,
            cancelText,
            destructive,
            onConfirm: onConfirm || null,
        });
    }, []);

    const handleDialogConfirm = useCallback(() => {
        const confirmHandler = dialog.onConfirm;
        closeDialog();
        if (typeof confirmHandler === 'function') {
            confirmHandler();
        }
    }, [dialog, closeDialog]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/api/alerts/');
            if (response.data) {
                const sortedData = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setNotifications(sortedData);
                setVisibleCount(PAGE_SIZE);
            }
        } catch (error) {
            console.error('Backend notifications fetch failed:', error);
            showToast('Could not load notifications.', 'error');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [fetchNotifications])
    );

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) {
                clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;
            }
        };
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    const restoreUndoSnapshot = useCallback(() => {
        if (!undoState.items.length) return;

        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }

        setNotifications(prev => {
            const byId = new Map(prev.map(item => [item.id, item]));
            undoState.items.forEach(item => byId.set(item.id, item));
            return Array.from(byId.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
        showToast('Notification restored.', 'success');
        setUndoState({ visible: false, items: [], message: '' });
    }, [undoState, showToast]);

    const markAsRead = async (item) => {
        const ids = item.groupedIds || [item.id];
        const previous = notifications;

        setNotifications(prev => prev.map(n => (ids.includes(n.id) ? { ...n, is_read: true } : n)));
        try {
            await Promise.all(ids.map(id => api.patch(`/api/alerts/${id}/read/`, { is_read: true })));
        } catch (error) {
            setNotifications(previous);
            console.error('Failed to mark notification as read:', error);
            showToast('Could not mark as read.', 'error');
        }
    };

    const deleteNotification = async (item) => {
        const ids = item.groupedIds || [item.id];
        const removedItems = notifications.filter(entry => ids.includes(entry.id));
        if (!removedItems.length) return;

        setNotifications(prev => prev.filter(entry => !ids.includes(entry.id)));

        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
        }

        setUndoState({
            visible: true,
            items: removedItems,
            message: ids.length > 1 ? 'Conversation notifications removed.' : 'Notification removed.',
        });

        undoTimerRef.current = setTimeout(() => {
            setUndoState({ visible: false, items: [], message: '' });
            undoTimerRef.current = null;
        }, 5000);

        try {
            await Promise.all(ids.map(id => api.delete(`/api/alerts/${id}/`)));
        } catch (error) {
            setNotifications(prev => [...removedItems, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setUndoState({ visible: false, items: [], message: '' });
            console.error('Failed to delete notification:', error);
            showToast('Could not delete notification.', 'error');
        }
    };

    const handleMarkAllRead = async () => {
        const hasUnread = notifications.some(n => !n.is_read);
        if (!hasUnread) return;

        const previous = notifications;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await api.post('/api/alerts/mark-all-read/');
            showToast('All notifications marked as read.', 'success');
        } catch (error) {
            setNotifications(previous);
            console.error("Error marking all read:", error);
            showToast('Could not mark all notifications as read.', 'error');
        }
    };

    const handleDeleteAll = () => {
        if (!notifications.length) return;

        openConfirmDialog({
            title: 'Delete all notifications?',
            message: 'This will permanently remove every notification in your list.',
            confirmText: 'Delete all',
            cancelText: 'Cancel',
            destructive: true,
            onConfirm: async () => {
                const previous = notifications;
                setNotifications([]);
                try {
                    await api.delete('/api/alerts/delete-all/');
                    showToast('All notifications deleted.', 'success');
                    setUndoState({ visible: false, items: [], message: '' });
                } catch (error) {
                    setNotifications(previous);
                    console.error('Failed to delete all notifications:', error);
                    showToast('Could not delete all notifications.', 'error');
                }
            },
        });
    };

    const handleNotificationPress = async (item) => {
        if (!item.is_read) {
            markAsRead(item);
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

                const computedDurationDays = (() => {
                    if (!booking?.check_in) return 1;
                    const start = new Date(booking.check_in);
                    const end = new Date(booking.check_out || booking.check_in);
                    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    return Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1, 1);
                })();

                const itineraryRaw = booking?.tour_package_detail?.itinerary_timeline;
                const itineraryPayload = itineraryRaw
                    ? (typeof itineraryRaw === 'string' ? itineraryRaw : JSON.stringify(itineraryRaw))
                    : null;

                const entityName = isAgency
                    ? (
                        booking?.agency_detail?.business_name ||
                        booking?.accommodation_detail?.agency_name ||
                        entityDetail?.full_name ||
                        entityDetail?.username ||
                        "Selected Agency"
                    )
                    : (
                        entityDetail?.full_name ||
                        `${entityDetail?.first_name || ''} ${entityDetail?.last_name || ''}`.trim() ||
                        entityDetail?.username ||
                        "Your Guide"
                    );

                router.push({
                    pathname: '/(protected)/payment',
                    params: {
                        bookingId: booking.id,
                        entityId: booking.agency || booking.guide || entityDetail?.id,
                        agencyId: booking?.accommodation_detail?.agency_id || null,
                        agencyLogo: booking?.agency_detail?.logo || booking?.agency_detail?.profile_picture || null,
                        entityName,
                        bookingType: isAgency ? 'agency' : 'guide',
                        assignedGuides: JSON.stringify(assignedGuides),
                        basePrice: booking.total_price || 1000, 
                        placeId: booking.destination || booking?.destination_detail?.id || null,
                        placeName: booking?.destination_detail?.name || "Your Adventure", 
                        checkInDate: booking.check_in, 
                        checkOutDate: booking.check_out, 
                        packageDuration: String(computedDurationDays),
                        tourPackageId: booking?.tour_package_detail?.id || booking?.tour_package || null,
                        itineraryTimeline: itineraryPayload,
                        accommodationId: booking?.accommodation_detail?.id || booking?.accommodation || null,
                        accommodationName: booking?.accommodation_detail?.title || booking?.accommodation_detail?.name || null,
                        numGuests: booking.num_guests, 
                    }
                });
            } catch (error) {
                console.error("Failed to load booking details:", error);
                openInfoDialog('Booking Error', 'Could not load booking details.');
            }
        } 
        else if (item.title === "New Message") {
            const partnerId = item.partner_id || null;
            const partnerName = item.partner_name || "User";

            if (!partnerId) {
                router.push('/(protected)/conversations');
                return;
            }

            router.push({
                pathname: '/(protected)/message',
                params: {
                    partnerId: String(partnerId),
                    partnerName,
                    partnerImage: item.partner_image || null,
                }
            });
        } 
        // 🔥 UPDATED: Handle "Content Warning" specifically
        else if (item.title === "Content Warning" || item.title === "Warning from Admin") {
            openInfoDialog('Administrative Warning', item.message);
        }
        else if (item.title === "Application Submitted") {
            openInfoDialog(item.title, item.message);
        }
        else if (item.title.toLowerCase().includes('refund')) {
            if (item.related_model === 'RefundRequest' && item.related_object_id) {
                try {
                    const refundRes = await api.get(`/api/payments/refunds/${item.related_object_id}/`);
                    const refund = refundRes.data || {};
                    const isRequestOwner = Number(refund?.requested_by) === Number(user?.id);

                    if (!isRequestOwner) {
                        openInfoDialog('Refund Update', item.message || 'A refund status update was received.');
                        return;
                    }

                    if (refund.booking_id) {
                        router.push({
                            pathname: '/(protected)/refundRequest',
                            params: {
                                bookingId: String(refund.booking_id),
                                bookingTitle: String(refund.booking_label || `Booking #${refund.booking_id}`),
                                downPayment: String(refund.payment_amount || 0),
                                refundId: String(refund.id || item.related_object_id),
                            },
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Failed to open refund context from notification:', error);
                    if (error?.response?.status === 403) {
                        openInfoDialog('Refund Update', item.message || 'A refund status update was received.');
                        return;
                    }
                }
            }
            openInfoDialog('Refund Update', item.message || 'A refund status update was received.');
        }
        else {
            openInfoDialog(item.title, item.message);
        }
    };

    const formatRelativeTime = (isoDate) => {
        const now = new Date();
        const date = new Date(isoDate);
        const diffMs = now.getTime() - date.getTime();
        const minutes = Math.floor(diffMs / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return days === 1 ? '1 day ago' : `${days} days ago`;
    };

    const groupedNotifications = useMemo(() => {
        const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const messageGroups = new Map();
        const list = [];

        sorted.forEach(item => {
            const isMessage = item.title === 'New Message' && item.partner_id;
            if (!isMessage) {
                list.push({ ...item, groupedIds: [item.id], messageCount: 1 });
                return;
            }

            const key = `message:${item.partner_id}`;
            const existing = messageGroups.get(key);

            if (!existing) {
                messageGroups.set(key, {
                    ...item,
                    groupedIds: [item.id],
                    messageCount: 1,
                });
                return;
            }

            existing.groupedIds.push(item.id);
            existing.messageCount += 1;
            existing.is_read = existing.is_read && item.is_read;
            if (new Date(item.created_at) > new Date(existing.created_at)) {
                existing.created_at = item.created_at;
                existing.related_object_id = item.related_object_id;
                existing.message = item.message;
            }
        });

        messageGroups.forEach(group => {
            const partnerName = group.partner_name || 'User';
            if (group.messageCount > 1) {
                group.message = `You have ${group.messageCount} messages from ${partnerName}`;
            }
            list.push(group);
        });

        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        return groupedNotifications.filter(item => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'unread') return !item.is_read;
            if (activeFilter === 'messages') return item.title === 'New Message';
            if (activeFilter === 'bookings') return item.title.toLowerCase().includes('booking');
            if (activeFilter === 'payments') {
                const normalized = item.title.toLowerCase();
                return normalized.includes('payment') || normalized.includes('refund');
            }
            return true;
        });
    }, [activeFilter, groupedNotifications]);

    const visibleNotifications = useMemo(() => {
        return filteredNotifications.slice(0, visibleCount);
    }, [filteredNotifications, visibleCount]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeFilter]);

    const handleScrollLoadMore = useCallback((event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
        if (distanceToBottom < 120 && visibleCount < filteredNotifications.length) {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredNotifications.length));
        }
    }, [visibleCount, filteredNotifications.length]);

    const categorizeNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayList = [];
        const weekList = [];

        visibleNotifications.forEach(item => {
            const itemDate = new Date(item.created_at);
            const timeDiff = today.getTime() - itemDate.getTime();
            const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            const displayItem = {
                ...item,
                icon: notificationIcons[item.title] || <Ionicons name="information-circle-outline" size={28} color="#0A2342" />,
                description: item.message, 
                time: formatRelativeTime(item.created_at), 
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

    const renderRightActions = (item) => (
        <View style={styles.swipeActionsContainer}>
            {!item.is_read && (
                <TouchableOpacity style={[styles.swipeActionButton, styles.swipeRead]} onPress={() => markAsRead(item)}>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={styles.swipeActionText}>Read</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.swipeActionButton, styles.swipeDelete]} onPress={() => deleteNotification(item)}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.swipeActionText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const renderNotification = (item) => (
        <ReanimatedSwipeable key={item.id} renderRightActions={() => renderRightActions(item)} overshootRight={false}>
            <TouchableOpacity
                style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
                onPress={item.action}
                activeOpacity={0.9}
            >
                <View style={styles.iconContainer}>{item.icon}</View>
                <View style={styles.textContainer}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                </View>

                <View style={styles.actionsColumn}>
                    {!item.is_read && (
                        <TouchableOpacity
                            onPress={(event) => {
                                event?.stopPropagation?.();
                                markAsRead(item);
                            }}
                            style={styles.iconActionButton}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="checkmark-done" size={18} color="#007AFF" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={(event) => {
                            event?.stopPropagation?.();
                            deleteNotification(item);
                        }}
                        style={styles.iconActionButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="trash-outline" size={17} color="#FF3B30" />
                    </TouchableOpacity>
                </View>

                {!item.is_read && <View style={styles.redDot} />}
            </TouchableOpacity>
        </ReanimatedSwipeable>
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
            <View>
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    
                    {/* --- ADDED BACK BUTTON --- */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                </View>
            </View>
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onScroll={handleScrollLoadMore}
                scrollEventThrottle={16}
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {FILTERS.map(filter => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                            onPress={() => setActiveFilter(filter.key)}
                        >
                            <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>{filter.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {filteredNotifications.length > 0 && (
                    <View style={styles.actionHeader}>
                        {filteredNotifications.some(n => !n.is_read) ? (
                            <TouchableOpacity onPress={handleMarkAllRead} style={styles.bulkActionButton}>
                                <Ionicons name="checkmark-done-outline" size={16} color="#007AFF" />
                                <Text style={styles.markAll}>Mark all read</Text>
                            </TouchableOpacity>
                        ) : <View />}

                        <TouchableOpacity onPress={handleDeleteAll} style={[styles.bulkActionButton, styles.deleteAllAction]}>
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            <Text style={styles.deleteAllText}>Delete all</Text>
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
                {filteredNotifications.length > 0 && visibleCount < filteredNotifications.length && (
                    <TouchableOpacity style={styles.loadMoreButton} onPress={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredNotifications.length))}>
                        <Text style={styles.loadMoreText}>Load more</Text>
                    </TouchableOpacity>
                )}

                {filteredNotifications.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>No notifications in this filter yet.</Text>
                    </View>
                )}
            </ScrollView>

            {undoState.visible && (
                <View style={styles.undoToast}>
                    <Text style={styles.undoToastText}>{undoState.message}</Text>
                    <TouchableOpacity onPress={restoreUndoSnapshot}>
                        <Text style={styles.undoToastAction}>UNDO</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal transparent visible={dialog.visible} animationType="fade" onRequestClose={closeDialog}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{dialog.title}</Text>
                        <Text style={styles.modalMessage}>{dialog.message}</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={closeDialog}>
                                <Text style={styles.modalCancelText}>{dialog.cancelText || 'Close'}</Text>
                            </TouchableOpacity>

                            {dialog.confirmText ? (
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        dialog.destructive ? styles.modalDestructiveButton : styles.modalConfirmButton,
                                    ]}
                                    onPress={handleDialogConfirm}
                                >
                                    <Text style={styles.modalConfirmText}>{dialog.confirmText}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
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
    
    // --- ADDED BACK BUTTON STYLE ---
    backButton: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        padding: 5, 
        zIndex: 10 
    },
    filtersContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#EAF0F7' },
    filterChipActive: { backgroundColor: '#0A2342' },
    filterChipText: { color: '#344255', fontWeight: '600', fontSize: 12 },
    filterChipTextActive: { color: '#FFFFFF' },

    actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15 },
    bulkActionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF3FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    deleteAllAction: { backgroundColor: '#FFECEC' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    sectionTitle: { fontWeight: '700', fontSize: 16, color: '#0A2342', marginHorizontal: 20, marginTop: 10 },
    markAll: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
    deleteAllText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
    notificationCard: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 20, marginVertical: 8, padding: 14, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2, position: 'relative' },
    unreadCard: { borderLeftWidth: 3, borderLeftColor: '#007AFF' },
    iconContainer: { marginRight: 10, marginTop: 4 },
    textContainer: { flex: 1, marginRight: 10 },
    notificationTitle: { fontWeight: '700', color: '#0A2342', fontSize: 14 },
    notificationDesc: { fontSize: 13, color: '#555', marginTop: 2 },
    notificationTime: { fontSize: 12, color: '#777', marginTop: 4 },
    actionsColumn: { alignItems: 'center', gap: 8, paddingTop: 2 },
    iconActionButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F6FA' },
    redDot: { width: 10, height: 10, backgroundColor: '#FF3B30', borderRadius: 5, position: 'absolute', top: 10, right: 10 },
    swipeActionsContainer: { flexDirection: 'row', alignItems: 'stretch', marginVertical: 8, marginRight: 20 },
    swipeActionButton: { width: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4, marginLeft: 8 },
    swipeRead: { backgroundColor: '#007AFF' },
    swipeDelete: { backgroundColor: '#FF3B30' },
    swipeActionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    loadMoreButton: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EAF0F7' },
    loadMoreText: { color: '#0A2342', fontWeight: '700', fontSize: 12 },
    undoToast: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
    undoToastText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1, marginRight: 10 },
    undoToastAction: { color: '#7DD3FC', fontSize: 13, fontWeight: '800' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(10, 35, 66, 0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#0A2342' },
    modalMessage: { marginTop: 10, fontSize: 14, color: '#495766', lineHeight: 20 },
    modalActions: { marginTop: 18, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalButton: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
    modalCancelButton: { backgroundColor: '#EEF2F6' },
    modalConfirmButton: { backgroundColor: '#007AFF' },
    modalDestructiveButton: { backgroundColor: '#FF3B30' },
    modalCancelText: { color: '#344255', fontWeight: '700', fontSize: 13 },
    modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
