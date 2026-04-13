import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import ScrollToTopButton from '../../components/ScrollToTopButton';

const REVIEWS_PAGE_SIZE = 10;
const SCROLL_TO_TOP_THRESHOLD = 280;
const RATING_FILTERS = [
    { key: 'all', label: 'All' },
    { key: '5', label: '5 stars' },
    { key: '4', label: '4 stars' },
    { key: '3', label: '3 stars' },
    { key: '2', label: '2 stars' },
    { key: '1', label: '1 star' },
];

const getPagedReviews = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
};

const hasNextReviewsPage = (payload, fallbackCount = 0) => {
    if (Array.isArray(payload)) {
        return fallbackCount >= REVIEWS_PAGE_SIZE;
    }
    return Boolean(payload?.next);
};

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
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const userId = Number(user?.id || 0);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const reviewsListRef = useRef(null);
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);
    const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');

    

    // Move fetchReviews outside useEffect so it can be reused
    const fetchReviews = useCallback(async ({ page = 1, reset = true } = {}) => {
        if (!userId) {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
            return;
        }

        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await api.get('/api/reviews/', {
                params: {
                    page,
                    page_size: REVIEWS_PAGE_SIZE,
                },
            });
            const reviewList = getPagedReviews(response.data);
            const hasMore = hasNextReviewsPage(response.data, reviewList.length);
            
            const receivedReviews = reviewList.filter(review => {
                const reviewedUserId = Number(review.reviewed_user?.id || review.reviewed_user || 0);
                return reviewedUserId === userId;
            });

            setReviews((previous) => {
                if (reset) return receivedReviews;
                const byId = new Map(previous.map((item) => [String(item.id), item]));
                receivedReviews.forEach((item) => {
                    byId.set(String(item.id), item);
                });
                return Array.from(byId.values());
            });

            setCurrentPage(page);
            setHasMorePages(hasMore);

        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchReviews({ page: 1, reset: true });
    }, [fetchReviews]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void (async () => {
            try {
                if (refreshUser) await refreshUser();
            } finally {
                fetchReviews({ page: 1, reset: true });
            }
        })();
    }, [fetchReviews, refreshUser]);

    const onEndReached = useCallback(() => {
        if (loading || refreshing || loadingMore || !hasMorePages) return;
        fetchReviews({ page: currentPage + 1, reset: false });
    }, [loading, refreshing, loadingMore, hasMorePages, currentPage, fetchReviews]);

    const handleReviewsScroll = useCallback((event) => {
        const offsetY = Number(event?.nativeEvent?.contentOffset?.y || 0);
        setShowScrollTopButton(offsetY > SCROLL_TO_TOP_THRESHOLD);
    }, []);

    const handleScrollToTop = useCallback(() => {
        reviewsListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const filteredReviews = useMemo(() => {
        if (selectedRatingFilter === 'all') return reviews;

        const expectedRating = Number.parseInt(selectedRatingFilter, 10);
        if (!Number.isFinite(expectedRating)) return reviews;

        return reviews.filter((review) => {
            const ratingValue = Number.parseInt(review?.rating, 10);
            return ratingValue === expectedRating;
        });
    }, [reviews, selectedRatingFilter]);

    const handleBackPress = useCallback(() => {
        router.back();
    }, [router]);

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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {RATING_FILTERS.map((filterItem) => {
                        const isActive = selectedRatingFilter === filterItem.key;
                        return (
                            <TouchableOpacity
                                key={filterItem.key}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setSelectedRatingFilter(filterItem.key)}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                    {filterItem.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    if (loading) {
        return (
            <ScreenSafeArea edges={['top']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <View style={styles.topHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>My Reviews</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={{ padding: 20 }}>
                     <View style={{ height: 140, backgroundColor: '#E0E6ED', borderRadius: 20, marginBottom: 25 }} />
                     <View style={{ width: 150, height: 22, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 15 }} />
                     
                     {[1, 2].map(i => (
                         <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' }}>
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                       <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E6ED', marginRight: 12 }} />
                                       <View style={{ gap: 6 }}>
                                           <View style={{ width: 100, height: 14, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                           <View style={{ width: 60, height: 10, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                       </View>
                                  </View>
                                  <View style={{ width: 50, height: 20, backgroundColor: '#E0E6ED', borderRadius: 10 }} />
                             </View>
                             <View style={{ height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 }} />
                             <View style={{ width: '100%', height: 14, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 6 }} />
                             <View style={{ width: '80%', height: 14, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                         </View>
                     ))}
                </View>
            </ScreenSafeArea>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.topHeader}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>My Reviews</Text>
                <View style={styles.headerSpacer} />
            </View>

            <FlatList
                ref={reviewsListRef}
                data={filteredReviews}
                renderItem={({ item }) => <ReviewCard review={item} />}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                onScroll={handleReviewsScroll}
                scrollEventThrottle={16}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.35}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Image 
                            source={require('../../assets/localynk_images/logo.png')} // Or any placeholder image
                            style={{width: 80, height: 80, opacity: 0.5, marginBottom: 15}}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyTitle}>
                            {selectedRatingFilter === 'all'
                                ? 'No Reviews Yet'
                                : `No ${selectedRatingFilter}-Star Reviews`}
                        </Text>
                        <Text style={styles.emptyText}>
                            {selectedRatingFilter === 'all'
                                ? 'Complete more tours to start earning reputation!'
                                : 'Try another filter to view more feedback.'}
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
                }
                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.listFooterLoader}>
                            <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <ScrollToTopButton
                visible={showScrollTopButton}
                onPress={handleScrollToTop}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    headerSpacer: {
        width: 36,
        height: 36,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    listContent: {
        paddingBottom: 30,
    },
    listFooterLoader: {
        paddingVertical: 16,
        alignItems: 'center',
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
    filterRow: {
        paddingTop: 8,
        paddingBottom: 4,
        gap: 10,
    },
    filterChip: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
    },
    filterChipActive: {
        borderColor: '#0072FF',
        backgroundColor: '#EFF6FF',
    },
    filterChipText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0072FF',
        fontWeight: '700',
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