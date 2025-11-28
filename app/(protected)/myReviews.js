import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const StarDisplay = ({ rating, size = 16 }) => (
    <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
            <Ionicons
                key={index}
                name={index < Math.round(rating) ? 'star' : 'star-outline'}
                size={size}
                color={index < Math.round(rating) ? '#FFD700' : '#d1d1d1'}
            />
        ))}
    </View>
);

const ReviewCard = ({ review }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.reviewerName}>{review.reviewer_username || 'Anonymous'}</Text>
            <StarDisplay rating={review.rating} />
        </View>
        <Text style={styles.comment}>{review.comment}</Text>
        <Text style={styles.timestamp}>{new Date(review.timestamp).toLocaleDateString()}</Text>
    </View>
);

const MyReviews = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReviews = async () => {
        if (!user) return;
        try {
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
    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReviews();
    }, [user]);

    const renderHeader = () => {
        const rating = user?.guide_rating ? parseFloat(user.guide_rating).toFixed(1) : 'N/A';
        const numericRating = user?.guide_rating ? parseFloat(user.guide_rating) : 0;

        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Your Average Rating</Text>
                <View style={styles.summaryRating}>
                    <Text style={styles.ratingValue}>{rating}</Text>
                    <StarDisplay rating={numericRating} size={28} />
                </View>
                <Text style={styles.reviewCount}>{reviews.length} total reviews</Text>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" color="#007AFF" />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={reviews}
                renderItem={({ item }) => <ReviewCard review={item} />}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="eye-off-outline" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>You don't have any reviews yet.</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]} />
                }
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    summaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    summaryRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    ratingValue: {
        fontSize: 42,
        fontWeight: 'bold',
        marginRight: 10,
    },
    reviewCount: {
        fontSize: 14,
        color: '#888',
    },
    starContainer: {
        flexDirection: 'row',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    comment: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 10,
    },
    timestamp: {
        fontSize: 12,
        color: '#aaa',
        textAlign: 'right',
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
});

export default MyReviews;