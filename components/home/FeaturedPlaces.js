import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
// Assuming you have an api utility like in your web app, otherwise use axios directly
import api from '../../api/api'; 

import FallbackImage from '../../assets/localynk_images/featured1.png';

const FeaturedPlaces = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    
    // State for data and loading
    const [featuredDestinations, setFeaturedDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch only items marked as "is_featured=true"
                const response = await api.get('api/destinations/?is_featured=true');
                setFeaturedDestinations(response.data);
            } catch (error) {
                console.error("Failed to fetch featured places:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / (180 + 12));
        setActiveIndex(currentIndex);
    };

    const handleCardPress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: "/(protected)/placesDetails",
                params: {
                    id: item.id.toString(),
                    // Use the 'image' field from DestinationListSerializer (which handles the absolute URL)
                    image: item.image || '', 
                },
            });
        }
    };

    const renderCard = ({ item, index }) => {
        // Handle Image: API provides 'image' (single URL) or we use fallback
        const imageSource = item.image 
            ? { uri: item.image } 
            : FallbackImage;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCardPress(item)}
            >
                <View style={[styles.featureCard, activeIndex === index && styles.activeCard]}>
                    <Image source={imageSource} style={styles.featureImage} resizeMode="cover" />
                    
                    <View style={styles.gradientOverlay} />
                    
                    <View style={styles.cardContent}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>
                                {item.average_rating ? item.average_rating : 'New'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureBottom}>
                        <View style={styles.textContainer}>
                            <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.featureText} numberOfLines={1}>
                                {item.location || item.category || 'Discover More'}
                            </Text>
                        </View>
                        <View style={styles.arrowIcon}>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { height: 250, justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color="#333" />
            </View>
        );
    }

    if (!featuredDestinations || featuredDestinations.length === 0) {
        return null; // Or return a "No featured places" text
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Featured Places</Text>
                <Text style={styles.subtitle}>
                    Handpicked destinations just for you.
                </Text>
            </View>

            <FlatList
                horizontal
                data={featuredDestinations}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featureList}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                snapToInterval={192} // 180 width + 12 margin
                decelerationRate="fast"
                renderItem={renderCard}
            />

            <View style={styles.indicatorContainer}>
                {featuredDestinations.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.indicator,
                            activeIndex === index && styles.activeIndicator,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

export default FeaturedPlaces;

const styles = StyleSheet.create({
    container: { marginTop: 30 },
    header: { paddingHorizontal: 15, marginBottom: 15 },
    title: { 
        fontSize: 18, 
        textTransform: 'uppercase', 
        letterSpacing: 1, 
        fontWeight: '700',
        color: '#1a1a1a'
    },
    subtitle: { 
        fontSize: 13, 
        color: '#666', 
        marginTop: 4,
        lineHeight: 18
    },
    featureList: { paddingHorizontal: 15, paddingBottom: 10 },
    featureCard: { 
        width: 180, 
        height: 200, 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginRight: 12,
        backgroundColor: '#f5f5f5',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    activeCard: {
        elevation: 6,
        shadowOpacity: 0.15,
    },
    featureImage: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 16 
    },
    gradientOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '65%', 
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    cardContent: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    featureBottom: { 
        position: 'absolute', 
        bottom: 12, 
        left: 12, 
        right: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        zIndex: 2,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    placeName: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    featureText: { 
        color: '#fff', 
        fontSize: 11, 
        fontWeight: '400',
        opacity: 0.9,
    },
    arrowIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ddd',
    },
    activeIndicator: {
        backgroundColor: '#333',
        width: 20,
    },
});