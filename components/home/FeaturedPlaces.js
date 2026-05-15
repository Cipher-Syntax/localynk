import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { styles } from './styles/FeaturedPlaces.styles';
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
    }, [isActive, scaleAnim]);

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
                    <Image source={imageSource} style={styles.photo} contentFit="cover" />
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
                        isActive={index === activeIndex}
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
