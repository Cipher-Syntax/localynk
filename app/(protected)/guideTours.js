import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, ArrowRight } from "lucide-react-native";
import api from '../../api/api';

const FALLBACK_DESTINATION_IMAGE = require('../../assets/localynk_images/login_background.png');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeCategoryValue = (value) => {
    if (!value) return '';
    if (typeof value === 'object') {
        return normalizeText(value.name || value.label || value.title);
    }
    return normalizeText(value);
};

const getCategoryLabel = (value) => {
    if (!value) return 'Destination';
    if (typeof value === 'object') {
        return value.name || value.label || value.title || 'Destination';
    }
    return String(value);
};

const getDestinationRating = (destination) => {
    const rating = parseFloat(destination?.average_rating ?? destination?.rating);
    return Number.isFinite(rating) ? rating : 0;
};

const GuideDestinations = () => {
    const { guideId, guideName } = useLocalSearchParams();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [destinations, setDestinations] = useState([]);
    const [destinationImageErrors, setDestinationImageErrors] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [minRating, setMinRating] = useState(0);

    useEffect(() => {
        const fetchDestinations = async () => {
            if (!guideId) return;
            try {
                // Fetch UNIQUE destinations for this guide
                const response = await api.get(`/api/guides/${guideId}/destinations/`);
                setDestinations(response.data || []);
            } catch (error) {
                console.error('Failed to fetch guide destinations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDestinations();
    }, [guideId]);

    const getImageUrl = (img) => {
        if (!img) return null;

        const path = typeof img === 'object' ? (img.image || img.url || img.photo) : img;
        if (!path) return null;

        const normalizedPath = String(path);
        if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

        const base = api.defaults.baseURL || process.env.EXPO_PUBLIC_API_URL || '';

        try {
            const parsedBase = new URL(base);
            const origin = `${parsedBase.protocol}//${parsedBase.host}`;
            return new URL(normalizedPath, `${origin}/`).toString();
        } catch (_error) {
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
            const suffix = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
            return `${prefix}${suffix}`;
        }
    };

    const markDestinationImageError = (imageKey) => {
        if (!imageKey) return;
        setDestinationImageErrors((previous) => {
            if (previous[imageKey]) return previous;
            return {
                ...previous,
                [imageKey]: true,
            };
        });
    };

    const categories = useMemo(() => {
        const categoryMap = new Map();

        destinations.forEach((destination) => {
            const normalizedValue = normalizeCategoryValue(destination?.category);
            if (!normalizedValue) return;

            if (!categoryMap.has(normalizedValue)) {
                categoryMap.set(normalizedValue, getCategoryLabel(destination?.category));
            }
        });

        return Array.from(categoryMap.entries()).map(([value, label]) => ({ value, label }));
    }, [destinations]);

    const filteredDestinations = useMemo(() => {
        const query = normalizeText(searchQuery);

        return destinations.filter((destination) => {
            const destinationName = normalizeText(destination?.name);
            const destinationLocation = normalizeText(destination?.location);
            const destinationCategory = normalizeCategoryValue(destination?.category);
            const destinationRating = getDestinationRating(destination);

            const matchesSearch = !query ||
                destinationName.includes(query) ||
                destinationLocation.includes(query) ||
                destinationCategory.includes(query);

            const matchesCategory = selectedCategory === 'all'
                ? true
                : destinationCategory === selectedCategory;

            const matchesRating = minRating > 0
                ? destinationRating >= minRating
                : true;

            return matchesSearch && matchesCategory && matchesRating;
        });
    }, [destinations, minRating, searchQuery, selectedCategory]);

    const hasActiveFilters = Boolean(searchQuery.trim()) || selectedCategory !== 'all' || minRating > 0;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setMinRating(0);
    };

    const handleSelectDestination = (destination) => {
        // Navigate to Guide Availability using the Destination ID (placeId)
        // The availability screen will look up the specific tour for this guide + destination
        router.push({
            pathname: "/(protected)/guideAvailability",
            params: { 
                guideId: guideId, 
                guideName: guideName,
                placeId: destination.id, 
                placeName: destination.name,
            }
        });
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <View style={{ height: 140, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ padding: 20 }}>
                    <View style={{ height: 16, width: 150, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 15 }} />
                    {[1, 2].map(i => (
                        <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, height: 210, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' }}>
                            <View style={{ height: 160, backgroundColor: '#E0E6ED' }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                                <View style={{ height: 24, width: 80, backgroundColor: '#E0E6ED', borderRadius: 12 }} />
                                <View style={{ height: 20, width: 60, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>AVAILABLE DESTINATIONS</Text>
                    <Text style={styles.headerSubtitle}>covered by {guideName}</Text>
                </View>

                {destinations.length > 0 && (
                    <View style={styles.filterCard}>
                        <View style={styles.searchInputWrap}>
                            <Ionicons name="search" size={16} color="#64748B" />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search destination, location, category"
                                placeholderTextColor="#94A3B8"
                                style={styles.searchInput}
                            />
                            {!!searchQuery && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color="#64748B" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterChipRow}
                        >
                            <TouchableOpacity
                                onPress={() => setSelectedCategory('all')}
                                style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>All categories</Text>
                            </TouchableOpacity>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.value}
                                    onPress={() => setSelectedCategory(category.value)}
                                    style={[styles.filterChip, selectedCategory === category.value && styles.filterChipActive]}
                                >
                                    <Text style={[styles.filterChipText, selectedCategory === category.value && styles.filterChipTextActive]}>{category.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.ratingRow}>
                            {[0, 3.5, 4, 4.5].map((ratingValue) => (
                                <TouchableOpacity
                                    key={String(ratingValue)}
                                    onPress={() => setMinRating(ratingValue)}
                                    style={[styles.ratingPill, minRating === ratingValue && styles.ratingPillActive]}
                                >
                                    <Ionicons name="star" size={12} color={minRating === ratingValue ? '#fff' : '#C99700'} />
                                    <Text style={[styles.ratingPillText, minRating === ratingValue && styles.ratingPillTextActive]}>
                                        {ratingValue === 0 ? 'All ratings' : `${ratingValue}+`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {hasActiveFilters && (
                            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                                <Ionicons name="refresh" size={14} color="#0369A1" />
                                <Text style={styles.clearFiltersText}>Clear filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {destinations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No active destinations found for this guide.</Text>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        <Text style={styles.sectionLabel}>Select a Place to Visit ({filteredDestinations.length})</Text>

                        {filteredDestinations.length === 0 && (
                            <View style={styles.filteredEmptyContainer}>
                                <Ionicons name="search-outline" size={36} color="#CBD5E1" />
                                <Text style={styles.filteredEmptyText}>No destinations match your current filters.</Text>
                            </View>
                        )}
                        
                        {filteredDestinations.map((dest, index) => {
                            const rawDestinationImage = dest.images && dest.images.length > 0
                                ? dest.images[0]
                                : (dest.image || dest.first_image || dest.thumbnail || null);
                            const destinationImageKey = String(dest.id || index);
                            const displayImage = destinationImageErrors[destinationImageKey]
                                ? null
                                : getImageUrl(rawDestinationImage);

                            return (
                                <TouchableOpacity 
                                    key={dest.id || index} 
                                    style={styles.destinationCard}
                                    activeOpacity={0.9}
                                    onPress={() => handleSelectDestination(dest)}
                                >
                                    <View style={styles.imageContainer}>
                                        {displayImage ? (
                                            <Image
                                                source={{ uri: displayImage }}
                                                style={styles.cardImage}
                                                onError={() => markDestinationImageError(destinationImageKey)}
                                            />
                                        ) : (
                                            <Image source={FALLBACK_DESTINATION_IMAGE} style={styles.cardImage} />
                                        )}
                                        <LinearGradient 
                                            colors={['transparent', 'rgba(0,0,0,0.7)']} 
                                            style={styles.cardGradient} 
                                        />
                                        <View style={styles.cardTextOverlay}>
                                            <Text style={styles.destinationName}>{dest.name}</Text>
                                            <View style={styles.locationRow}>
                                                <MapPin size={12} color="#fff" />
                                                <Text style={styles.locationText}>{dest.location}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardFooter}>
                                        <View style={styles.metaBadgeRow}>
                                            <Text style={styles.categoryBadge}>{getCategoryLabel(dest.category)}</Text>
                                            {getDestinationRating(dest) > 0 && (
                                                <View style={styles.footerRatingBadge}>
                                                    <Ionicons name="star" size={11} color="#C99700" />
                                                    <Text style={styles.footerRatingText}>{getDestinationRating(dest).toFixed(1)}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.arrowBtn}>
                                            <Text style={styles.selectText}>View Plan</Text>
                                            <ArrowRight size={16} color="#00A8FF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default GuideDestinations;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    
    header: { height: 140, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 35, left: 20, color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSubtitle: { position: 'absolute', bottom: 15, left: 20, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
    
    backButton: { position: 'absolute', top: 20, left: 20, padding: 5, zIndex: 10 },

    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: '#8B98A8', textAlign: 'center' },

    filterCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0F172A',
    },
    filterChipRow: {
        paddingTop: 10,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
    },
    filterChipActive: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0EA5E9',
    },
    filterChipText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0369A1',
        fontWeight: '700',
    },
    ratingRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        backgroundColor: '#F5F7FA',
    },
    ratingPillActive: {
        backgroundColor: '#00A8FF',
        borderColor: '#00A8FF',
    },
    ratingPillText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    ratingPillTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    clearFiltersButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    clearFiltersText: {
        fontSize: 12,
        color: '#0369A1',
        fontWeight: '700',
    },

    contentContainer: { padding: 20 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    filteredEmptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        marginBottom: 14,
    },
    filteredEmptyText: {
        marginTop: 10,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },

    destinationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    imageContainer: { height: 160, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
    cardTextOverlay: { position: 'absolute', bottom: 12, left: 16, right: 16 },
    
    destinationName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 3 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff' },
    metaBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryBadge: { fontSize: 12, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '600' },
    footerRatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FEF9C3' },
    footerRatingText: { fontSize: 11, fontWeight: '700', color: '#854D0E' },
    
    arrowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    selectText: { fontSize: 13, color: '#00A8FF', fontWeight: '700' }
});
