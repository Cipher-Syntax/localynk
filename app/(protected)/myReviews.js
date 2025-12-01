import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const StarDisplay = ({ rating, size = 16, color = '#FFD700' }) => (
    <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
            <Ionicons
                key={index}
                name={index < Math.round(rating) ? 'star' : 'star-outline'}
                size={size}
                color={index < Math.round(rating) ? color : '#E2E8F0'}
            />
        ))}
    </View>
);

const ReviewCard = ({ review }) => {
    const initials = review.reviewer_username ? review.reviewer_username.charAt(0).toUpperCase() : 'A';
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View>
                        <Text style={styles.reviewerName}>{review.reviewer_username || 'Anonymous'}</Text>
                        <Text style={styles.timestamp}>{new Date(review.timestamp).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFF" style={{marginRight: 3}} />
                    <Text style={styles.ratingText}>{review.rating}.0</Text>
                </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.comment}>{review.comment}</Text>
            
            {review.booking && (
                <View style={styles.bookingTag}>
                    <Ionicons name="bookmark-outline" size={12} color="#64748B" />
                    <Text style={styles.bookingText}>Trip ID: {review.booking}</Text>
                </View>
            )}
        </View>
    );
};

const MyReviews = () => {
    const { user, refreshUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = async () => {
        if (!user) return;
        try {
            if (refreshUser) await refreshUser();

            const response = await api.get('/api/reviews/');
            const reviewList = response.data.results || response.data || [];
            
            const receivedReviews = reviewList.filter(review => {
                const reviewedUserId = review.reviewed_user?.id || review.reviewed_user;
                return reviewedUserId === user.id;
            });
            
            setReviews(receivedReviews);

        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReviews();
    }, [user]);

    const renderHeader = () => {
        const rating = user?.guide_rating ? parseFloat(user.guide_rating).toFixed(1) : '0.0';
        const reviewCount = reviews.length;

        return (
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#0072FF', '#00C6FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statsCard}
                >
                    <View style={styles.statsContent}>
                        <View>
                            <Text style={styles.statsTitle}>Overall Rating</Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.bigRating}>{rating}</Text>
                                <View style={{marginLeft: 8}}>
                                    <StarDisplay rating={parseFloat(rating)} size={18} color="#FFD700" />
                                    <Text style={styles.totalReviewsText}>{reviewCount} Total Reviews</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.iconCircle}>
                            <Ionicons name="trophy" size={32} color="#0072FF" />
                        </View>
                    </View>
                </LinearGradient>
                
                <Text style={styles.sectionTitle}>Recent Feedback</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topHeader}>
                <Text style={styles.screenTitle}>My Reviews</Text>
            </View>

            <FlatList
                data={reviews}
                renderItem={({ item }) => <ReviewCard review={item} />}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Image 
                            source={require('../../assets/localynk_images/logo.png')} // Or any placeholder image
                            style={{width: 80, height: 80, opacity: 0.5, marginBottom: 15}}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                        <Text style={styles.emptyText}>
                            Complete more tours to start earning reputation!
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    topHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    listContent: {
        paddingBottom: 30,
    },
    headerContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    statsCard: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 25,
    },
    statsContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bigRating: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
    },
    totalReviewsText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 5,
    },
    starContainer: {
        flexDirection: 'row',
    },
    
    // Review Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    timestamp: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    ratingText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },
    comment: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    bookingTag: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    bookingText: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 6,
        fontFamily: 'monospace',
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default MyReviews;