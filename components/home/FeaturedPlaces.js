import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, Image, StyleSheet,
    TouchableOpacity, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import FallbackImage from '../../assets/localynk_images/featured1.png';

const CARD_WIDTH = 200;
const CARD_GAP = 14;

const FeaturedCard = ({ item, isActive, onPress }) => {
    const imageSource = item.image ? { uri: item.image } : FallbackImage;
    const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.96)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isActive ? 1 : 0.96,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [isActive]);

    const reviewCount = item.review_count || Math.floor(Math.random() * 200 + 50);

    return (
        <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.92}
                style={styles.card}
            >
                {/* Photo */}
                <View style={styles.photoContainer}>
                    <Image source={imageSource} style={styles.photo} resizeMode="cover" />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                        style={styles.photoOverlay}
                    />

                    {/* "Featured" badge */}
                    <View style={styles.featuredBadge}>
                        <Ionicons name="ribbon-outline" size={9} color="#FFD700" />
                        <Text style={styles.featuredBadgeText}>FEATURED</Text>
                    </View>

                    {/* Rating on photo */}
                    {item.average_rating && (
                        <View style={styles.photoRating}>
                            <Ionicons name="star" size={9} color="#FFD700" />
                            <Text style={styles.photoRatingText}>
                                {parseFloat(item.average_rating).toFixed(1)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info block */}
                <View style={styles.infoBlock}>
                    <View style={styles.nameRow}>
                        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color="#0072FF" />
                        </View>
                    </View>

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={11} color="#888" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.location || 'Zamboanga City'}
                        </Text>
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name="star"
                                    size={9}
                                    color={star <= Math.round(parseFloat(item.average_rating || 4)) ? '#FFB800' : '#E0E0E0'}
                                />
                            ))}
                            <Text style={styles.reviewCount}>({reviewCount})</Text>
                        </View>
                        <TouchableOpacity style={styles.viewBtn} onPress={onPress} activeOpacity={0.85}>
                            <Text style={styles.viewBtnText}>View</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const FeaturedPlaces = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [featuredDestinations, setFeaturedDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('api/destinations/?is_featured=true');
                setFeaturedDestinations(res.data);
            } catch (e) {
                console.error('Featured fetch failed:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleScroll = (e) => {
        const x = e.nativeEvent.contentOffset.x;
        setActiveIndex(Math.round(x / (CARD_WIDTH + CARD_GAP)));
    };

    const handleCardPress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({ pathname: '/(protected)/placesDetails', params: { id: item.id.toString() } });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0072FF" />
            </View>
        );
    }

    if (!featuredDestinations || featuredDestinations.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionLabel}>✦ HAND-PICKED</Text>
                    <Text style={styles.sectionTitle}>Featured Places</Text>
                </View>
                <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => router.push({ pathname: '/(protected)/explore', params: { tab: 'places' } })}
                >
                    <Text style={styles.seeAllText}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color="#0072FF" />
                </TouchableOpacity>
            </View>

            {/* Cards */}
            <FlatList
                horizontal
                data={featuredDestinations}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                snapToInterval={CARD_WIDTH + CARD_GAP}
                decelerationRate="fast"
                renderItem={({ item, index }) => (
                    <FeaturedCard
                        item={item}
                        isActive={activeIndex === index}
                        onPress={() => handleCardPress(item)}
                    />
                )}
            />

            {/* Progress dots */}
            <View style={styles.dotsRow}>
                {featuredDestinations.map((_, i) => (
                    <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
                ))}
            </View>
        </View>
    );
};

export default FeaturedPlaces;

const styles = StyleSheet.create({
    container: { marginTop: 24 },
    loadingContainer: { height: 240, justifyContent: 'center', alignItems: 'center' },

    // ── HEADER ──
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingHorizontal: 16, marginBottom: 14,
    },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: '#0072FF', letterSpacing: 1.5, marginBottom: 3 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F1923', letterSpacing: -0.3 },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 13, color: '#0072FF', fontWeight: '600' },

    // ── CARDS ──
    listContent: { paddingHorizontal: 16, paddingBottom: 4 },
    cardWrap: { marginRight: CARD_GAP },
    card: {
        width: CARD_WIDTH, borderRadius: 18, overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 4, shadowColor: '#003580',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    },
    photoContainer: { width: '100%', height: 200, position: 'relative' },
    photo: { width: '100%', height: '100%' },
    photoOverlay: { position: 'absolute', inset: 0 },
    featuredBadge: {
        position: 'absolute', top: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    },
    featuredBadgeText: { color: '#FFD700', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
    photoRating: {
        position: 'absolute', bottom: 8, right: 8,
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    },
    photoRatingText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // ── INFO ──
    infoBlock: { padding: 12, gap: 5 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    placeName: { fontSize: 14, fontWeight: '700', color: '#0F1923', flex: 1, marginRight: 4 },
    verifiedBadge: {},
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationText: { fontSize: 11, color: '#888', flex: 1 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
    reviewCount: { fontSize: 10, color: '#999', marginLeft: 3 },
    viewBtn: {
        backgroundColor: '#0072FF', paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 8,
    },
    viewBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    // ── DOTS ──
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D1DDE8' },
    dotActive: { width: 18, backgroundColor: '#0072FF' },
});