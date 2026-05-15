import { Image } from 'expo-image';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, TextInput, FlatList, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import api from '../../api/api';
import ScrollToTopButton from '../ScrollToTopButton';
import NewPackageHighlightsModal from '../NewPackageHighlightsModal';
import { fetchDestinationHighlights } from '../../utils/newPackageHighlights';
import { styles } from './styles/explorePlaces.styles';

const FALLBACK_IMAGE = require('../../assets/localynk_images/discover1.png'); 


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
    const [destinationHighlightCounts, setDestinationHighlightCounts] = useState({});
    const [destinationHighlightsById, setDestinationHighlightsById] = useState({});
    const [highlightsTargetDate, setHighlightsTargetDate] = useState(null);
    const [highlightsModalVisible, setHighlightsModalVisible] = useState(false);
    const [selectedHighlightDestination, setSelectedHighlightDestination] = useState(null);

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

    useEffect(() => {
        let isMounted = true;

        const destinationIds = places
            .map((place) => Number.parseInt(place?.id, 10))
            .filter((id) => Number.isFinite(id) && id > 0);

        if (destinationIds.length === 0) {
            setDestinationHighlightCounts({});
            setDestinationHighlightsById({});
            setHighlightsTargetDate(null);
            return () => {
                isMounted = false;
            };
        }

        const loadHighlights = async () => {
            try {
                const highlights = await fetchDestinationHighlights({
                    destinationIds,
                    limitPerDestination: 3,
                });

                if (!isMounted) return;

                setDestinationHighlightCounts(highlights.countsByDestinationId || {});
                setDestinationHighlightsById(highlights.byDestinationId || {});
                setHighlightsTargetDate(highlights.targetDate || null);
            } catch (_error) {
                if (!isMounted) return;
                setDestinationHighlightCounts({});
                setDestinationHighlightsById({});
                setHighlightsTargetDate(null);
            }
        };

        loadHighlights();

        return () => {
            isMounted = false;
        };
    }, [places]);

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

    const openPlaceHighlights = useCallback((place) => {
        const placeIdKey = String(place?.id || '').trim();
        if (!placeIdKey) return;

        const highlightCount = Number(destinationHighlightCounts[placeIdKey] || 0);
        const highlightsEntry = destinationHighlightsById[placeIdKey];

        if (!highlightsEntry || highlightCount <= 0) return;

        setSelectedHighlightDestination({
            destinationName: place?.name || highlightsEntry.destination_name,
            packages: Array.isArray(highlightsEntry.packages) ? highlightsEntry.packages : [],
        });
        setHighlightsModalVisible(true);
    }, [destinationHighlightCounts, destinationHighlightsById]);

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

    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const fullName = normalizeText(`${guide.first_name || ''} ${guide.last_name || ''}`);
            const specialtySource = Array.isArray(guide.specialties) && guide.specialties.length > 0
                ? guide.specialties
                : (Array.isArray(guide.specializations) && guide.specializations.length > 0
                    ? guide.specializations
                    : [guide.specialty || guide.specialization]);
            const specialty = normalizeText(specialtySource.join(' '));
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

    // ✨ RE-RENDER & SORTING FIX: 
    // Added `destinationHighlightCounts` as a dependency so it re-sorts & re-renders when data lands.
    const filteredPlaces = useMemo(() => {
        const result = places.filter(place => {
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

        // ✨ SORTING FIX: Explicitly sort places with highlight counts to the top
        return result.sort((a, b) => {
            const aCount = Number(destinationHighlightCounts[String(a.id)] || 0);
            const bCount = Number(destinationHighlightCounts[String(b.id)] || 0);
            return bCount - aCount;
        });
    }, [places, shouldApplySearchFilter, normalizedSearchQuery, selectedCategoryNormalized, minRating, destinationHighlightCounts]);

    const chunkData = (data, size) => {
        if (!data || !Array.isArray(data)) return [];
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    };

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
                    <Text style={styles.detailValue} numberOfLines={1}>
                        {Array.isArray(item.specialties) && item.specialties.length > 0
                            ? item.specialties.join(', ')
                            : (item.specialty || 'General')}
                    </Text>
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
                    params: { guideId: item.id, guideName },
                })}
            >
                <Text style={styles.bookButton}>VIEW DESTINATIONS</Text>
            </TouchableOpacity>
        </View>
    );
    };

    const PlaceCard = ({ item, onPress, highlightCount = 0, onOpenHighlights }) => {
        const placeImageUri = getImageUrl(item.image || item.first_image || item.thumbnail);
        const imageSource = placeImageUri ? { uri: placeImageUri } : FALLBACK_IMAGE;

        return (
            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
                {/* Photo */}
                <View style={styles.photoWrap}>
                    <Image
                        source={imageSource}
                        style={styles.photo}
                        contentFit="cover"
                    />

                    {/* New package highlight badge */}
                    {highlightCount > 0 && (
                        <TouchableOpacity
                            style={styles.newBadge}
                            onPress={(e) => { e.stopPropagation?.(); onOpenHighlights?.(item); }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="sparkles-outline" size={9} color="#fff" />
                            <View style={styles.newBadgeTextWrap}>
                                <Text style={styles.newBadgeText} numberOfLines={1}>
                                    NEW TOUR PACKAGE {highlightCount}
                                </Text>
                                <Text style={styles.newBadgeTapHint} numberOfLines={1}>TAP FOR MORE</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* White Info Section */}
                <View style={styles.infoWrap}>
                    {/* Category + rating */}
                    <View style={styles.topRow}>
                        {item.category ? (
                            <View style={styles.catTag}>
                                <Text style={styles.catTagText}>{item.category}</Text>
                            </View>
                        ) : <View />}
                        {item.average_rating && (
                            <View style={styles.ratingTag}>
                                <Ionicons name="star" size={9} color="#FFB800" />
                                <Text style={styles.ratingTagText}>
                                    {parseFloat(item.average_rating).toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                    {/* Location */}
                    <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={10} color="#888" />
                        <Text style={styles.locText} numberOfLines={1}>
                            {item.location || 'Zamboanga City'}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* CTA */}
                    <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
                        <Text style={styles.ctaText}>Explore</Text>
                        <Ionicons name="arrow-forward-outline" size={11} color="#0072FF" />
                    </TouchableOpacity>
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

        return (
            <View style={styles.placesRow}>
                {chunk.map(place => {
                    const placeIdKey = String(place?.id || '').trim();
                    const highlightCount = Number(destinationHighlightCounts[placeIdKey] || 0);

                    return (
                        <PlaceCard
                            key={place.id}
                            item={place}
                            onPress={() => router.push({
                                pathname: "/(protected)/placesDetails",
                                params: { id: place.id.toString() },
                            })}
                            highlightCount={highlightCount}
                            onOpenHighlights={openPlaceHighlights}
                        />
                    );
                })}
                {chunk.length === 1 && <View style={styles.cardPlaceholder} />}
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

    const displayData = activeTab === 'guides' ? filteredGuides : chunkData(filteredPlaces, 2);
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
                // ✨ FIX: Forces the FlatList to re-render rows when this data finishes loading
                extraData={destinationHighlightCounts}
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

            <NewPackageHighlightsModal
                visible={highlightsModalVisible}
                onClose={() => setHighlightsModalVisible(false)}
                destinationName={selectedHighlightDestination?.destinationName}
                targetDate={highlightsTargetDate}
                packages={selectedHighlightDestination?.packages || []}
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
