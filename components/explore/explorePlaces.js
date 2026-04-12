import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, Animated, Easing, TextInput, FlatList, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import api from '../../api/api';
import ScrollToTopButton from '../ScrollToTopButton';

const FALLBACK_IMAGE = require('../../assets/localynk_images/discover1.png'); 

const GAP = 12;
const PADDING = 16;
const LARGE_HEIGHT = 280;
const SMALL_HEIGHT = (LARGE_HEIGHT - GAP) / 2;
const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_CHARS = 2;
const EXPLORE_PAGE_SIZE = 10;
const SCROLL_TO_TOP_THRESHOLD = 320;

const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeCategoryValue = (value) => {
    if (!value) return '';

    if (typeof value === 'object') {
        return normalizeText(value.name || value.label || value.title);
    }

    return normalizeText(value);
};

const getGuideRatingValue = (guide) => {
    const rating = parseFloat(guide?.guide_rating ?? guide?.rating ?? guide?.average_rating);
    return Number.isFinite(rating) ? rating : 0;
};

const getPlaceRatingValue = (place) => {
    const rating = parseFloat(place?.average_rating ?? place?.rating);
    return Number.isFinite(rating) ? rating : 0;
};

const getGuideIdKey = (guide) => String(guide?.id ?? guide?.user_id ?? '').trim();

const getFavoriteGuideIdKey = (guide) => String(guide?.id ?? guide?.guide_id ?? '').trim();

const toGuideIdPayload = (guideIdKey) => {
    const numericId = Number(guideIdKey);
    return Number.isFinite(numericId) ? numericId : guideIdKey;
};

const extractPageItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
};

const hasNextPage = (payload, fallbackCount = 0) => {
    if (Array.isArray(payload)) {
        return fallbackCount >= EXPLORE_PAGE_SIZE;
    }
    return Boolean(payload?.next);
};

const ExplorePlaces = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const initialTab = getParamValue(params.tab) || 'guides';
    const initialCategory = getParamValue(params.category) || '';
    const initialQuery = getParamValue(params.q) || '';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory); 
    
    // UI Search State (updates instantly for the text input)
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    // Filter Search State (waits for user to stop typing before updating)
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(String(initialQuery).trim());

    // Filter States
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [minGuideGuests, setMinGuideGuests] = useState('');
    const [withProfilePhotoOnly, setWithProfilePhotoOnly] = useState(false);
    const [selectedGuideLocation, setSelectedGuideLocation] = useState('');

    const [guides, setGuides] = useState([]);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guidesPage, setGuidesPage] = useState(1);
    const [placesPage, setPlacesPage] = useState(1);
    const [hasMoreGuides, setHasMoreGuides] = useState(true);
    const [hasMorePlaces, setHasMorePlaces] = useState(true);
    const [loadingMoreGuides, setLoadingMoreGuides] = useState(false);
    const [loadingMorePlaces, setLoadingMorePlaces] = useState(false);
    const [guideImageErrors, setGuideImageErrors] = useState({});
    const [favorites, setFavorites] = useState(new Set());

    const bounceValue = useRef(new Animated.Value(0)).current;
    const exploreListRef = useRef(null);
    const [showScrollTopButton, setShowScrollTopButton] = useState(false);

    

    useEffect(() => {
        const startBounce = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceValue, {
                        toValue: -10,
                        duration: 400,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceValue, {
                        toValue: 0,
                        duration: 400,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }

        startBounce();
    }, [bounceValue]);

    // Debounce Effect: waits before applying query to reduce expensive list filtering while typing.
    useEffect(() => {
        const normalizedQuery = String(searchQuery || '').trim();
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(normalizedQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer); // Cleanup timer on every keystroke
    }, [searchQuery]);

    // Watch for params changes if navigated from other tabs
    useEffect(() => {
        const nextTab = getParamValue(params.tab);
        const nextCategory = getParamValue(params.category);
        const nextQuery = getParamValue(params.q);

        if (nextTab) setActiveTab(nextTab);
        if (nextCategory !== undefined) setSelectedCategory(nextCategory || '');
        if (nextQuery !== undefined) setSearchQuery(nextQuery || '');
    }, [params.tab, params.category, params.q]);

    const normalizedSearchQuery = useMemo(
        () => String(debouncedSearchQuery || '').trim().toLowerCase(),
        [debouncedSearchQuery],
    );

    const selectedCategoryNormalized = useMemo(
        () => normalizeCategoryValue(selectedCategory),
        [selectedCategory],
    );

    const placeCategories = useMemo(() => {
        const categoryMap = new Map();

        places.forEach((place) => {
            const rawCategory = place?.category;
            const normalizedValue = normalizeCategoryValue(rawCategory);
            if (!normalizedValue) return;

            if (!categoryMap.has(normalizedValue)) {
                const label = typeof rawCategory === 'object'
                    ? (rawCategory?.name || rawCategory?.label || rawCategory?.title || normalizedValue)
                    : String(rawCategory);

                categoryMap.set(normalizedValue, label);
            }
        });

        return Array.from(categoryMap.entries()).map(([value, label]) => ({
            value,
            label,
        }));
    }, [places]);

    const selectedCategoryLabel = useMemo(() => {
        if (!selectedCategoryNormalized) return '';

        const selected = placeCategories.find((category) => category.value === selectedCategoryNormalized);
        return selected?.label || selectedCategory;
    }, [placeCategories, selectedCategory, selectedCategoryNormalized]);

    const shouldApplySearchFilter = normalizedSearchQuery.length >= MIN_SEARCH_CHARS;

    const fetchGuidesPage = useCallback(async ({ page = 1, reset = true } = {}) => {
        if (!reset) setLoadingMoreGuides(true);

        try {
            const response = await api.get('/api/guides/', {
                params: {
                    page,
                    page_size: EXPLORE_PAGE_SIZE,
                },
            });

            const incoming = extractPageItems(response.data);
            const hasMore = hasNextPage(response.data, incoming.length);

            setGuides((previous) => {
                if (reset) return incoming;
                const byId = new Map(previous.map((item) => [String(item.id ?? item.user_id), item]));
                incoming.forEach((item) => {
                    byId.set(String(item.id ?? item.user_id), item);
                });
                return Array.from(byId.values());
            });

            setGuidesPage(page);
            setHasMoreGuides(hasMore);
        } catch (error) {
            console.error('Failed to fetch guides:', error);
            if (reset) {
                setGuides([]);
            }
        } finally {
            setLoadingMoreGuides(false);
        }
    }, []);

    const fetchPlacesPage = useCallback(async ({ page = 1, reset = true } = {}) => {
        if (!reset) setLoadingMorePlaces(true);

        try {
            const response = await api.get('/api/destinations/', {
                params: {
                    page,
                    page_size: EXPLORE_PAGE_SIZE,
                },
            });

            const incoming = extractPageItems(response.data);
            const hasMore = hasNextPage(response.data, incoming.length);

            setPlaces((previous) => {
                if (reset) return incoming;
                const byId = new Map(previous.map((item) => [String(item.id), item]));
                incoming.forEach((item) => {
                    byId.set(String(item.id), item);
                });
                return Array.from(byId.values());
            });

            setPlacesPage(page);
            setHasMorePlaces(hasMore);
        } catch (error) {
            console.error('Failed to fetch places:', error);
            if (reset) {
                setPlaces([]);
            }
        } finally {
            setLoadingMorePlaces(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const favoritesPromise = api.get('/api/favorites/').catch(() => ({ data: [] }));

                const [favoritesRes] = await Promise.all([
                    favoritesPromise,
                    fetchGuidesPage({ page: 1, reset: true }),
                    fetchPlacesPage({ page: 1, reset: true }),
                ]);

                if (isMounted) {
                    const favoritesData = Array.isArray(favoritesRes.data) ? favoritesRes.data : [];
                    const favoriteIds = new Set(
                        favoritesData
                            .map((guide) => getFavoriteGuideIdKey(guide))
                            .filter(Boolean),
                    );

                    setFavorites(favoriteIds);
                }
            } catch (error) {
                console.error('Critical failure fetching data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false };
    }, [fetchGuidesPage, fetchPlacesPage]);

    const refreshFavorites = useCallback(async () => {
        try {
            const response = await api.get('/api/favorites/');
            const data = Array.isArray(response.data) ? response.data : [];
            setFavorites(
                new Set(
                    data
                        .map((guide) => getFavoriteGuideIdKey(guide))
                        .filter(Boolean),
                ),
            );
        } catch (_error) {
            // Keep current state when refresh fails.
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites]),
    );

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;

        const path = typeof imgPath === 'object'
            ? (imgPath.image || imgPath.url || imgPath.photo)
            : imgPath;

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

    const getGuideImagePath = (guide) =>
        guide?.profile_picture || guide?.profile_image || guide?.avatar || null;

    const getGuideMaxGuests = (guide) => {
        const tours = Array.isArray(guide?.tours) ? guide.tours : [];
        const maxFromTours = tours.reduce((max, tour) => {
            const pax = parseInt(tour?.max_group_size, 10);
            return Number.isFinite(pax) && pax > max ? pax : max;
        }, 0);

        const fallbackFromGuide = [
            guide?.max_group_size,
            guide?.max_guests,
            guide?.max_guest,
            guide?.max_pax,
            guide?.guest_limit,
            guide?.group_size,
        ].reduce((max, value) => {
            const parsed = parseInt(value, 10);
            return Number.isFinite(parsed) && parsed > max ? parsed : max;
        }, 0);

        return Math.max(maxFromTours, fallbackFromGuide);
    };

    const getGuideMaxGuestsLabel = (guide) => {
        const maxGuests = getGuideMaxGuests(guide);
        return maxGuests > 0 ? `${maxGuests} guests` : 'Per package';
    };

    const markGuideImageError = (guideImageKey) => {
        if (!guideImageKey) return;
        setGuideImageErrors((previous) => {
            if (previous[guideImageKey]) return previous;
            return {
                ...previous,
                [guideImageKey]: true,
            };
        });
    };

    const toggleFavorite = async (guideIdKey) => {
        if (!guideIdKey) return;

        const payloadGuideId = toGuideIdPayload(guideIdKey);

        setFavorites((previous) => {
            const next = new Set(previous);
            if (next.has(guideIdKey)) {
                next.delete(guideIdKey);
            } else {
                next.add(guideIdKey);
            }
            return next;
        });

        try {
            await api.post('/api/favorites/toggle/', { guide_id: payloadGuideId });
        } catch (error) {
            // Revert optimistic update when request fails.
            setFavorites((previous) => {
                const reverted = new Set(previous);
                if (reverted.has(guideIdKey)) {
                    reverted.delete(guideIdKey);
                } else {
                    reverted.add(guideIdKey);
                }
                return reverted;
            });
            console.error('Failed to toggle favorite in explore:', error);
        }
    };

    // OPTIMIZED: Memoized Guide Filters using debounced search
    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const fullName = normalizeText(`${guide.first_name || ''} ${guide.last_name || ''}`);
            const specialty = normalizeText(guide.specialty || guide.specialization);
            const locationText = normalizeText(guide.location || guide.address || guide.city);
            const languageText = Array.isArray(guide.languages)
                ? normalizeText(guide.languages.join(' '))
                : normalizeText(guide.languages);
            const guideImageUri = getImageUrl(getGuideImagePath(guide));
            const hasProfilePhoto = !!guideImageUri;
            const maxGuests = getGuideMaxGuests(guide);

            const searchableText = `${fullName} ${specialty} ${locationText} ${languageText}`;

            const matchesSearch = !shouldApplySearchFilter ||
                searchableText.includes(normalizedSearchQuery);
            const matchesLocation = selectedGuideLocation
                ? locationText.includes(normalizeText(selectedGuideLocation))
                : true;

            const minGuestsValue = parseInt(minGuideGuests, 10);
            const matchesMinGuests = Number.isFinite(minGuestsValue) && minGuestsValue > 0
                ? maxGuests >= minGuestsValue
                : true;

            const matchesProfilePhoto = withProfilePhotoOnly ? hasProfilePhoto : true;

            const guideRating = getGuideRatingValue(guide);
            const matchesRating = minRating > 0 ? guideRating >= minRating : true;

            return matchesSearch && matchesLocation && matchesMinGuests && matchesProfilePhoto && matchesRating;
        });
    }, [guides, shouldApplySearchFilter, normalizedSearchQuery, selectedGuideLocation, minGuideGuests, withProfilePhotoOnly, minRating]);

    // OPTIMIZED: Memoized Places Filters using debounced search
    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const placeName = normalizeText(place.name);
            const placeLocation = normalizeText(place.location || place.address || place.city);
            const placeCategory = normalizeCategoryValue(place.category);

            const matchesSearch = !shouldApplySearchFilter ||
                placeName.includes(normalizedSearchQuery) ||
                placeLocation.includes(normalizedSearchQuery) ||
                placeCategory.includes(normalizedSearchQuery);
            const matchesCategory = selectedCategoryNormalized
                ? placeCategory === selectedCategoryNormalized
                : true;

            const placeRating = getPlaceRatingValue(place);
            const matchesRating = minRating > 0 ? placeRating >= minRating : true;

            return matchesSearch && matchesCategory && matchesRating;
        });
    }, [places, shouldApplySearchFilter, normalizedSearchQuery, selectedCategoryNormalized, minRating]);

    const chunkData = (data, size) => {
        if (!data || !Array.isArray(data)) return [];
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    };

    // Helper: Check if there are any active filters to display the clear badge
    const hasActiveFilters = activeTab === 'places'
        ? (selectedCategoryNormalized !== '' || minRating > 0)
        : (minRating > 0 || minGuideGuests !== '' || selectedGuideLocation !== '' || withProfilePhotoOnly);

    const clearAllFilters = () => {
        setSelectedCategory('');
        setMinRating(0);
        setMinGuideGuests('');
        setWithProfilePhotoOnly(false);
        setSelectedGuideLocation('');
    };

    const renderAvailability = (guideDays) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const shortDays = ["M", "T", "W", "T", "F", "S", "S"];
        const safeGuideDays = guideDays || [];

        return (
            <View style={styles.availabilityContainer}>
                {days.map((day, index) => {
                    const isAvailable = safeGuideDays.includes(day) || safeGuideDays.includes("All");
                    return (
                        <View 
                            key={index} 
                            style={[
                                styles.dayBadge, 
                                isAvailable ? styles.dayAvailable : styles.dayUnavailable
                            ]}
                        >
                            <Text style={[
                                styles.dayText, 
                                isAvailable ? styles.dayTextAvailable : styles.dayTextUnavailable
                            ]}>
                                {shortDays[index]}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const GuideCardStack = ({ item }) => {
        const guideName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Guide';
        const guideImageKey = String(item.id || item.user_id || guideName);
        const guideIdKey = getGuideIdKey(item);
        const isFavorited = Boolean(guideIdKey && favorites.has(guideIdKey));
        const guideImageUri = getImageUrl(getGuideImagePath(item));
        const showGuideImage = Boolean(guideImageUri && !guideImageErrors[guideImageKey]);

        return (
        <View style={styles.guideCardStack}>
            <View style={styles.cardProfileSection}>
                <View style={[styles.iconWrapper, showGuideImage && styles.iconWrapperWithImage]}>
                    {showGuideImage ? (
                        <Image
                            source={{ uri: guideImageUri }}
                            style={styles.guideAvatarImage}
                            onError={() => markGuideImageError(guideImageKey)}
                        />
                    ) : (
                        <User size={30} color="#8B98A8" />
                    )}
                </View>

                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.guideName}>{guideName}</Text>
                        {renderAvailability(item.available_days)}
                    </View>

                    <Text style={styles.guideAddress}>{item.location || 'Zamboanga City'}</Text>
                    <Text style={styles.guideRating}>
                        {item.guide_rating || 'New'} <Ionicons name="star" size={12} color="#C99700" />
                    </Text>
                </View>

                <TouchableOpacity onPress={() => toggleFavorite(guideIdKey)} disabled={!guideIdKey}>
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={22}
                        color={isFavorited ? '#FF5A5F' : '#94A3B8'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Specialty</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{item.specialty || 'General'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Language</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                        {Array.isArray(item.languages) ? item.languages[0] : (item.languages || 'N/A')}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Experience</Text>
                    <Text style={styles.detailValue}>{item.experience_years || 0} years</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Max Guests</Text>
                    <Text style={styles.detailValue}>{getGuideMaxGuestsLabel(item)}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.buttonContainer} 
                activeOpacity={0.8} 
                onPress={() => router.push({
                    pathname: "/(protected)/guideTours",
                    params: {
                        guideId: item.id,
                        guideName,
                    },
                })}
            >
                <Text style={styles.bookButton}>VIEW DESTINATIONS</Text>
            </TouchableOpacity>
        </View>
    );
    };

    const PlaceCardBento = ({ item, style }) => {
        const placeImageUri = getImageUrl(item.image || item.first_image || item.thumbnail);
        const imageSource = placeImageUri
            ? { uri: placeImageUri }
            : FALLBACK_IMAGE;

        return (
            <TouchableOpacity 
                style={[styles.placeCard, style]} 
                onPress={() => router.push({
                    pathname: "/(protected)/placesDetails",
                    params: { id: item.id.toString() },
                })}
                activeOpacity={0.9}
            >
                <Image 
                    source={imageSource} 
                    style={styles.placeImage} 
                    resizeMode="cover" 
                />

                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}

                <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} 
                    style={styles.gradient} 
                />

                <View style={styles.infoOverlay}>
                    <View style={styles.placeNameRow}>
                        <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                        {item.average_rating && (
                             <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={8} color="#FFD700" />
                                <Text style={styles.ratingText}>{parseFloat(item.average_rating).toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.placeLocationRow}>
                        <Ionicons name="location" size={10} color="#fff" />
                        <Text style={styles.placeLocation} numberOfLines={1}>{item.location || 'Zamboanga City'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item, index }) => {
        if (activeTab === 'guides') {
            return <GuideCardStack item={item} />;
        }

        const chunk = item;
        if (!chunk || chunk.length === 0) return null;
        const isBigLeft = index % 2 === 0;

        return (
            <View style={styles.rowContainer}>
                {chunk.length === 3 ? (
                    isBigLeft ? (
                        <>
                            <PlaceCardBento item={chunk[0]} style={{ width: '64%', height: LARGE_HEIGHT }} />
                            <View style={styles.columnContainer}>
                                <PlaceCardBento item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                                <PlaceCardBento item={chunk[2]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.columnContainer}>
                                <PlaceCardBento item={chunk[0]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                                <PlaceCardBento item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                            </View>
                            <PlaceCardBento item={chunk[2]} style={{ width: '64%', height: LARGE_HEIGHT }} />
                        </>
                    )
                ) : chunk.length === 2 ? (
                    <>
                        <PlaceCardBento item={chunk[0]} style={{ width: '48%', height: LARGE_HEIGHT }} />
                        <PlaceCardBento item={chunk[1]} style={{ width: '48%', height: LARGE_HEIGHT }} />
                    </>
                ) : (
                    <PlaceCardBento item={chunk[0]} style={{ width: '100%', height: LARGE_HEIGHT * 0.8 }} />
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />

                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    EXPLORE {activeTab === 'guides' ? 'GUIDES' : (selectedCategoryLabel ? selectedCategoryLabel.toUpperCase() : 'PLACES')}
                </Text>
            </View>

            <View style={styles.searchFilterRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#8B98A8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'guides' ? "Search guide by name, specialty, language" : "Search places..."}
                        placeholderTextColor="#8B98A8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {!!searchQuery && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color="#8B98A8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Open Filter Modal */}
                <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                    <Ionicons name="options-outline" size={22} color="#00A8FF" />
                    {hasActiveFilters && <View style={styles.filterActiveDot} />}
                </TouchableOpacity>
            </View>

            {!!searchQuery.trim() && searchQuery.trim().length < MIN_SEARCH_CHARS && (
                <View style={styles.searchHintContainer}>
                    <Text style={styles.searchHintText}>
                        Type at least {MIN_SEARCH_CHARS} characters to filter results.
                    </Text>
                </View>
            )}

            <View style={styles.toggleRow}>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, activeTab === 'guides' && styles.toggleButtonActive]}
                        onPress={() => setActiveTab('guides')}
                    >
                        <Text style={[styles.toggleButtonText, activeTab === 'guides' && styles.toggleButtonTextActive]}>
                            Tour Guides
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleButton, activeTab === 'places' && styles.toggleButtonActive]}
                        onPress={() => setActiveTab('places')}
                    >
                        <Text style={[styles.toggleButtonText, activeTab === 'places' && styles.toggleButtonTextActive]}>
                            Places
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dynamic Filter Badge */}
            {hasActiveFilters && (
                <View style={styles.activeFilterContainer}>
                    <Text style={styles.activeFilterText}>
                        Filters applied {selectedCategoryLabel && activeTab === 'places' ? `(${selectedCategoryLabel})` : ''}
                    </Text>
                    <TouchableOpacity onPress={clearAllFilters} style={styles.clearFilterBadge}>
                        <Ionicons name="close" size={14} color="#fff" />
                        <Text style={styles.clearFilterText}>Clear All</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderEmpty = () => {
        if (loading) {
            return (
                <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                    <View style={{ height: activeTab === 'guides' ? 220 : 280, backgroundColor: '#E0E6ED', borderRadius: 15, marginBottom: 16 }} />
                    <View style={{ height: activeTab === 'guides' ? 220 : 280, backgroundColor: '#E0E6ED', borderRadius: 15, marginBottom: 16 }} />
                    <View style={{ height: activeTab === 'guides' ? 220 : 280, backgroundColor: '#E0E6ED', borderRadius: 15, marginBottom: 16 }} />
                </View>
            );
        }
        return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No results found.</Text></View>;
    };

    const displayData = activeTab === 'guides' ? filteredGuides : chunkData(filteredPlaces, 3);
    const isLoadingMore = activeTab === 'guides' ? loadingMoreGuides : loadingMorePlaces;

    const handleEndReached = useCallback(() => {
        if (loading || isLoadingMore) return;

        if (activeTab === 'guides') {
            if (!hasMoreGuides) return;
            fetchGuidesPage({ page: guidesPage + 1, reset: false });
            return;
        }

        if (!hasMorePlaces) return;
        fetchPlacesPage({ page: placesPage + 1, reset: false });
    }, [
        loading,
        isLoadingMore,
        activeTab,
        hasMoreGuides,
        hasMorePlaces,
        guidesPage,
        placesPage,
        fetchGuidesPage,
        fetchPlacesPage,
    ]);

    const handleExploreScroll = useCallback((event) => {
        const offsetY = Number(event?.nativeEvent?.contentOffset?.y || 0);
        setShowScrollTopButton(offsetY > SCROLL_TO_TOP_THRESHOLD);
    }, []);

    const handleScrollToTop = useCallback(() => {
        exploreListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                ref={exploreListRef}
                key={activeTab}
                data={displayData}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.contentContainer}
                onScroll={handleExploreScroll}
                scrollEventThrottle={16}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.35}
                ListHeaderComponent={renderHeader()}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.listFooterLoader}>
                            <Ionicons name="reload" size={18} color="#00A8FF" />
                        </View>
                    ) : null
                }
                showsVerticalScrollIndicator={false}
            />

            <ScrollToTopButton
                visible={showScrollTopButton}
                onPress={handleScrollToTop}
            />

            {/* Filter Bottom Sheet Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <SafeAreaView edges={['bottom']} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filters ({activeTab === 'guides' ? 'Guides' : 'Places'})</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1A2332" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

                            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                            <View style={styles.ratingFilterContainer}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <TouchableOpacity 
                                        key={star} 
                                        style={[styles.ratingPill, minRating === star && styles.ratingPillActive]}
                                        onPress={() => setMinRating(minRating === star ? 0 : star)}
                                    >
                                        <Ionicons name="star" size={14} color={minRating === star ? "#fff" : "#C99700"} />
                                        <Text style={[styles.ratingPillText, minRating === star && styles.ratingPillTextActive]}>{star}+</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {activeTab === 'places' && (
                                <>
                                    <Text style={styles.filterSectionTitle}>Category</Text>
                                    <View style={styles.categoryFilterContainer}>
                                        {placeCategories.map(cat => (
                                            <TouchableOpacity 
                                                key={cat.value}
                                                style={[styles.categoryPill, selectedCategoryNormalized === cat.value && styles.categoryPillActive]}
                                                onPress={() => setSelectedCategory(selectedCategoryNormalized === cat.value ? '' : cat.value)}
                                            >
                                                <Text style={[styles.categoryPillText, selectedCategoryNormalized === cat.value && styles.categoryPillTextActive]}>{cat.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {activeTab === 'guides' && (
                                <>
                                    <Text style={styles.filterSectionTitle}>Minimum Guest Capacity</Text>
                                    <TextInput
                                        style={styles.filterInput}
                                        placeholder="e.g. 6"
                                        placeholderTextColor="#8B98A8"
                                        keyboardType="numeric"
                                        value={minGuideGuests}
                                        onChangeText={setMinGuideGuests}
                                    />

                                    <TouchableOpacity
                                        style={[styles.toggleFilterRow, withProfilePhotoOnly && styles.toggleFilterRowActive]}
                                        onPress={() => setWithProfilePhotoOnly((prev) => !prev)}
                                        activeOpacity={0.8}
                                    >
                                        <View>
                                            <Text style={styles.toggleFilterTitle}>With Profile Photo</Text>
                                            <Text style={styles.toggleFilterSubtitle}>Show guides with available profile image.</Text>
                                        </View>
                                        <Ionicons
                                            name={withProfilePhotoOnly ? 'checkmark-circle' : 'ellipse-outline'}
                                            size={20}
                                            color={withProfilePhotoOnly ? '#00A8FF' : '#94A3B8'}
                                        />
                                    </TouchableOpacity>

                                    <Text style={styles.filterSectionTitle}>Location</Text>
                                    <TextInput
                                        style={styles.filterInput}
                                        placeholder="e.g. Zamboanga City"
                                        placeholderTextColor="#8B98A8"
                                        value={selectedGuideLocation}
                                        onChangeText={setSelectedGuideLocation}
                                    />
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.modalClearButton}
                                onPress={clearAllFilters}
                            >
                                <Text style={styles.modalClearButtonText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalApplyButton}
                                onPress={() => setIsFilterModalVisible(false)}
                            >
                                <Text style={styles.modalApplyButtonText}>Show Results</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

export default ExplorePlaces;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { alignItems: 'center', marginTop: 50 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#8B98A8', fontSize: 16 },
    listFooterLoader: { paddingVertical: 16, alignItems: 'center' },

    header: { position: 'relative', height: 120, justifyContent: 'center', width: '100%' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

    backButton: {
        position: 'absolute',
        top: 20, 
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)', 
        padding: 6,
        borderRadius: 20,
    },

    searchFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF0F5', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D0DAE3' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1A2332' },
    searchHintContainer: { paddingHorizontal: 16, marginBottom: 8 },
    searchHintText: { fontSize: 12, color: '#64748B' },

    filterButton: { position: 'relative', backgroundColor: '#EBF0F5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D0DAE3' },
    filterActiveDot: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5A5F', borderWidth: 2, borderColor: '#fff' },

    toggleRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
    toggleContainer: { flexDirection: 'row', width: '100%', gap: 12 },
    toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00A8FF', backgroundColor: '#fff', alignItems: 'center' },
    toggleButtonActive: { backgroundColor: '#00A8FF' },
    toggleButtonText: { fontSize: 14, fontWeight: '600', color: '#00A8FF' },
    toggleButtonTextActive: { color: '#fff' },

    activeFilterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10, backgroundColor: '#E8F6FF', paddingVertical: 8, marginHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#BFE4FF' },
    activeFilterText: { fontSize: 13, color: '#006699', fontWeight: '600' },
    clearFilterBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    clearFilterText: { color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 2 },

    contentContainer: { paddingBottom: 40 },

    rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: GAP, marginHorizontal: PADDING },
    columnContainer: { width: '33%', justifyContent: 'space-between', height: LARGE_HEIGHT },

    placeCard: { 
        borderRadius: 16, 
        overflow: 'hidden', 
        backgroundColor: '#f0f0f0', 
        elevation: 2, 
        position: 'relative' 
    },
    placeImage: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', zIndex: 1 },

    infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, zIndex: 2 },
    placeNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    placeName: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1, marginRight: 5, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowRadius: 3 },

    placeLocationRow: { flexDirection: 'row', alignItems: 'center' },
    placeLocation: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginLeft: 4, flex: 1, fontWeight: '500' },

    categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 5 },
    categoryText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

    ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    ratingText: { color: '#fff', fontSize: 9, fontWeight: '700', marginLeft: 2 },

    guideCardStack: { 
        backgroundColor: '#F5F7FA', 
        borderRadius: 15, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: '#E0E6ED', 
        marginBottom: 16,
        marginHorizontal: 16,
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardProfileSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    iconWrapperWithImage: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0DAE3' },
    guideAvatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    profileInfo: { flex: 1, marginLeft: 12 },

    nameRow: { flexDirection: 'column', alignItems: 'flex-start' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideAddress: { fontSize: 12, color: '#8B98A8' },
    guideRating: { fontSize: 12, color: '#C99700', marginTop: 2 },

    availabilityContainer: { flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 4 },
    dayBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    dayAvailable: { backgroundColor: '#28A745' },
    dayUnavailable: { backgroundColor: '#E0E0E0' },
    dayText: { fontSize: 9, fontWeight: '700' },
    dayTextAvailable: { color: '#fff' },
    dayTextUnavailable: { color: '#A0A0A0' },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    detailItem: { width: '48%', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    detailLabel: { fontSize: 11, color: '#8B98A8', fontWeight: '600', textTransform: 'uppercase' },
    detailValue: { fontSize: 13, color: '#1A2332', fontWeight: '600', marginTop: 4 },

    buttonContainer: { alignItems: 'center' },
    bookButton: { backgroundColor: '#00C6FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', width: '100%', overflow: 'hidden' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A2332' },
    modalBody: { marginBottom: 20 },

    filterSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1A2332', marginBottom: 12, marginTop: 16 },

    ratingFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    ratingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' },
    ratingPillActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    ratingPillText: { fontSize: 14, fontWeight: '600', color: '#8B98A8', marginLeft: 4 },
    ratingPillTextActive: { color: '#fff' },

    categoryFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' },
    categoryPillActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    categoryPillText: { fontSize: 14, fontWeight: '500', color: '#1A2332' },
    categoryPillTextActive: { color: '#fff', fontWeight: '600' },

    toggleFilterRow: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleFilterRowActive: {
        borderColor: '#7DD3FC',
        backgroundColor: '#E8F6FF',
    },
    toggleFilterTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
    },
    toggleFilterSubtitle: {
        marginTop: 2,
        fontSize: 11,
        color: '#64748B',
    },

    filterInput: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 10, padding: 12, fontSize: 15, color: '#1A2332' },

    modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E6ED' },
    modalClearButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EBF0F5', alignItems: 'center' },
    modalClearButtonText: { fontSize: 15, fontWeight: '600', color: '#1A2332' },
    modalApplyButton: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00A8FF', alignItems: 'center' },
    modalApplyButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
