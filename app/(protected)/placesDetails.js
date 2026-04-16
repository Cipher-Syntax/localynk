import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import CompactMapCard from '../../components/location/CompactMapCard';

const REVIEWS_PAGE_SIZE = 10;
const SCROLL_TO_TOP_THRESHOLD = 320;

const extractReviewItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
};

const hasNextReviewPage = (payload, fallbackCount = 0) => {
    if (Array.isArray(payload)) {
        return fallbackCount >= REVIEWS_PAGE_SIZE;
    }
    return Boolean(payload?.next);
};

export default function PlacesDetails() {
    const [loading, setLoading] = useState(true);
    const [destination, setDestination] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewPage, setReviewPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(true);
    const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);
    
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const bounceValue = useRef(new Animated.Value(0)).current;
    const placeDetailsScrollRef = useRef(null);

    const startBounce = useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceValue, { toValue: -10, duration: 400, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(bounceValue, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: true }),
            ])
        ).start();
    }, [bounceValue]);

    const fetchReviewsPage = useCallback(async ({ page = 1, reset = true } = {}) => {
        if (!id) return;
        if (!reset) setLoadingMoreReviews(true);

        try {
            const reviewsResponse = await api.get('/api/destination_reviews/', {
                params: {
                    destination: id,
                    page,
                    page_size: REVIEWS_PAGE_SIZE,
                },
            });

            const incoming = extractReviewItems(reviewsResponse.data);
            const hasMore = hasNextReviewPage(reviewsResponse.data, incoming.length);

            setReviews((previous) => {
                if (reset) return incoming;
                const byId = new Map(previous.map((item) => [String(item.id), item]));
                incoming.forEach((item) => byId.set(String(item.id), item));
                return Array.from(byId.values());
            });

            setReviewPage(page);
            setHasMoreReviews(hasMore);
        } catch (error) {
            console.error('Error fetching destination reviews:', error);
            if (reset) setReviews([]);
        } finally {
            setLoadingMoreReviews(false);
        }
    }, [id]);

    useEffect(() => {
        startBounce();
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Destination Details
                const destResponse = await api.get(`/api/destinations/${id}/`);
                setDestination(destResponse.data);
                await fetchReviewsPage({ page: 1, reset: true });

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, startBounce, fetchReviewsPage]);

    const handleLoadMoreReviews = useCallback((event) => {
        const offsetY = Number(event?.nativeEvent?.contentOffset?.y || 0);
        setShowScrollTopButton(offsetY > SCROLL_TO_TOP_THRESHOLD);

        if (loading || loadingMoreReviews || !hasMoreReviews) return;

        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const distanceToBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

        if (distanceToBottom < 160) {
            fetchReviewsPage({ page: reviewPage + 1, reset: false });
        }
    }, [loading, loadingMoreReviews, hasMoreReviews, reviewPage, fetchReviewsPage]);

    const handleScrollToTop = useCallback(() => {
        placeDetailsScrollRef.current?.scrollTo({ y: 0, animated: true });
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ height: 280, margin: 15, borderRadius: 24, backgroundColor: '#E0E6ED' }} />
                <View style={{ height: 60, marginHorizontal: 15, borderRadius: 16, backgroundColor: '#E0E6ED', marginBottom: 24 }} />
                <View style={{ paddingHorizontal: 15 }}>
                    <View style={{ height: 24, width: 100, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 12 }} />
                    <View style={{ height: 16, width: '100%', backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ height: 16, width: '100%', backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ height: 16, width: '80%', backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                </View>
            </View>
        );
    }

    if (!destination) {
        return (
            <View style={styles.loader}>
                <Text>Destination not found.</Text>
            </View>
        );
    }

    const heroImageUri = destination.images && destination.images.length > 0 
        ? destination.images[activeImageIndex]?.image 
        : null;

    // Calculate Average Rating if not provided by backend
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
        : (destination.average_rating || "New");

    return (
        <View style={styles.container}>
            <ScrollView
                ref={placeDetailsScrollRef}
                style={styles.container}
                showsVerticalScrollIndicator={false}
                onScroll={handleLoadMoreReviews}
                scrollEventThrottle={16}
            >
                <SafeAreaView edges={['bottom']}>

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    
                    {/* --- ADDED BACK BUTTON --- */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>EXPLORE YOUR NEXT DESTINATION</Text>
                </View>

                {/* HERO SECTION */}
                <View style={styles.heroContainer}>
                    <Image 
                        source={heroImageUri ? { uri: heroImageUri } : require('../../assets/localynk_images/login_background.jpg')} 
                        style={styles.heroImage} 
                    />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.heroOverlay} />
                    
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{destination.name}</Text>
                        <View style={styles.ratingRow}>
                            <Star size={16} color="#FACC15" fill="#FACC15" />
                            <Text style={styles.ratingText}>{averageRating} ({reviews.length} Reviews)</Text>
                        </View>
                    </View>

                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{destination.category}</Text>
                    </View>

                    <View style={styles.imageIndicators}>
                        {destination.images?.map((_, idx) => (
                            <View key={idx} style={[styles.indicator, activeImageIndex === idx && styles.activeIndicator]} />
                        ))}
                    </View>
                </View>

                {/* INFO & LOCATION */}
                <View style={styles.infoCard}>
                    <MapPin size={20} color="#3B82F6" />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoText}>{destination.location}</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 15 }}>
                    <CompactMapCard
                        latitude={destination.latitude}
                        longitude={destination.longitude}
                        title="Destination Pin"
                        subtitle={destination.location || destination.name}
                        locationText={destination.location || destination.name}
                    />
                </View>

                {/* DESCRIPTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.sectionText}>{destination.description}</Text>
                </View>

                {/* GALLERY */}
                {destination.images && destination.images.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Photo Gallery</Text>
                        <FlatList
                            horizontal
                            data={destination.images}
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 5 }}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity onPress={() => setActiveImageIndex(index)} activeOpacity={0.8}>
                                    <View style={[styles.imageCard, activeImageIndex === index && styles.activeImageCard]}>
                                        <Image source={{ uri: item.image }} style={styles.imageCardImage} />
                                        <View style={styles.imageOverlay} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* ATTRACTIONS */}
                {destination.attractions && destination.attractions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Featured Attractions</Text>
                        {destination.attractions.map((item) => (
                            <View key={item.id} style={styles.attractionCard}>
                                {item.photo && (
                                    <Image source={{ uri: item.photo }} style={styles.attractionImage} />
                                )}
                                <View style={styles.attractionContent}>
                                    <View style={styles.attractionHeader}>
                                        <Text style={styles.attractionTitle}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.attractionDesc}>{item.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* REVIEWS SECTION */}
                <View style={styles.section}>
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#FFF" fill="#FFF" />
                            <Text style={styles.ratingBadgeText}>{averageRating}</Text>
                        </View>
                    </View>

                    {reviews.length === 0 ? (
                        <View style={styles.emptyReviewsContainer}>
                             <Image 
                                source={require('../../assets/localynk_images/logo.png')} 
                                style={styles.emptyReviewsImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
                            <Text style={styles.emptyReviewsText}>Be the first to share your experience!</Text>
                        </View>
                    ) : (
                        <>
                            {reviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewerInfo}>
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarText}>
                                                    {review.reviewer_username ? review.reviewer_username.charAt(0).toUpperCase() : "A"}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.reviewerName}>{review.reviewer_username || "Traveler"}</Text>
                                                <Text style={styles.reviewDate}>{new Date(review.timestamp).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.starsRow}>
                                            {[...Array(5)].map((_, i) => (
                                                <Ionicons 
                                                    key={i} 
                                                    name={i < review.rating ? "star" : "star-outline"} 
                                                    size={14} 
                                                    color="#FACC15" 
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                </View>
                            ))}
                            {loadingMoreReviews && (
                                <View style={{ paddingVertical: 12 }}>
                                    <Ionicons name="reload" size={18} color="#3B82F6" style={{ alignSelf: 'center' }} />
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* ACTION BUTTON */}
                <View style={styles.stickyFooter}>
                    <TouchableOpacity style={styles.bookButton} 
                        onPress={() => router.push({ 
                            pathname: '/(protected)/bookingChoice',
                            params: { 
                                placeId: destination.id,
                                placeName: destination.name
                            }
                        })}
                    >
                        <LinearGradient
                            colors={['#0072FF', '#00C6FF']}
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientBtn}
                        >
                            <Calendar size={20} color="#fff" style={{marginRight: 8}} />
                            <Text style={styles.bookButtonText}>Book a Guide Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                </SafeAreaView>
            </ScrollView>

            <ScrollToTopButton
                visible={showScrollTopButton}
                onPress={handleScrollToTop}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

    // --- ADDED BACK BUTTON STYLE ---
    backButton: { position: 'absolute', top: 20, left: 20, padding: 5, zIndex: 10 },

    heroContainer: { height: 280, margin: 15, borderRadius: 24, overflow: 'hidden', position: 'relative', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height: 5} },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
    heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 },
    
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    
    categoryBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0,height:2} },
    categoryText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    
    imageIndicators: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', gap: 4 },
    indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeIndicator: { width: 20, backgroundColor: '#fff' },

    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, marginHorizontal: 15, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },

    section: { paddingHorizontal: 15, marginTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    sectionText: { fontSize: 15, color: '#475569', lineHeight: 24 },

    imageCard: { width: 140, height: 100, borderRadius: 12, overflow: 'hidden', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
    activeImageCard: { borderColor: '#3B82F6' },
    imageCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' },
    
    attractionCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
    attractionImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
    attractionContent: { flex: 1, justifyContent: 'center' },
    attractionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    attractionDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },

    // Reviews Styles
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    ratingBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    
    // Empty Reviews Styling
    emptyReviewsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: 8
    },
    emptyReviewsImage: {
        width: 80, 
        height: 80, 
        opacity: 0.5, 
        marginBottom: 12
    },
    emptyReviewsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4
    },
    emptyReviewsText: { 
        fontSize: 14, 
        color: '#94A3B8', 
        textAlign: 'center' 
    },
    
    reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#0284C7' },
    reviewerName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    reviewDate: { fontSize: 11, color: '#94A3B8' },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },

    stickyFooter: { padding: 20, paddingBottom: 40 },
    bookButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
    bookButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
