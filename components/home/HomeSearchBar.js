import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const RECENT_SEARCHES_KEY = '@localynk_home_recent_searches';
const MAX_RECENT_SEARCHES = 6;
const DEFAULT_IMAGE = require('../../assets/localynk_images/login_background.png');

const CATEGORY_ORDER = ['tourists', 'tourGuides', 'agencies', 'destinations'];

const CATEGORY_CONFIG = {
    tourists: { label: 'Tourists', icon: 'user', color: '#B45309' },
    tourGuides: { label: 'Tour Guides', icon: 'compass', color: '#0369A1' },
    agencies: { label: 'Agencies', icon: 'briefcase', color: '#166534' },
    destinations: { label: 'Destinations', icon: 'map-pin', color: '#0F766E' },
};

const API_CATEGORY_MAP = {
    tourists: 'tourists',
    tourist: 'tourists',
    users: 'tourists',
    user: 'tourists',
    tour_guides: 'tourGuides',
    tour_guide: 'tourGuides',
    guides: 'tourGuides',
    guide: 'tourGuides',
    agencies: 'agencies',
    agency: 'agencies',
    services: 'agencies',
    service: 'agencies',
    destinations: 'destinations',
    destination: 'destinations',
    places: 'destinations',
    place: 'destinations',
};

const createEmptyGroupedResults = () => ({
    tourists: [],
    tourGuides: [],
    agencies: [],
    destinations: [],
});

const normalizeCategory = (rawValue) => {
    const normalized = String(rawValue || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');

    return API_CATEGORY_MAP[normalized] || null;
};

const extractSearchPayload = (responseData) => {
    if (responseData?.data !== undefined) return responseData.data;
    if (responseData?.results !== undefined) return responseData.results;
    return responseData;
};

const isSubsequenceMatch = (text, query) => {
    if (!text || !query) return false;

    let queryIndex = 0;
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === query[queryIndex]) {
            queryIndex += 1;
            if (queryIndex === query.length) return true;
        }
    }

    return false;
};

const getMatchScore = (text, query) => {
    if (!text || !query) return 0;

    if (text.startsWith(query)) return 4;
    if (text.includes(query)) return 3;
    if (isSubsequenceMatch(text, query)) return 1;

    return 0;
};

const pickFirstString = (...values) => {
    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return '';
};

const normalizeResultItem = (item, category, index) => {
    if (!item || typeof item !== 'object') return null;

    const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ').trim();
    const title = pickFirstString(
        item.name,
        item.title,
        fullName,
        item.username,
        item.email,
        item.display_name,
    );

    const subtitle = pickFirstString(
        item.location,
        item.address,
        item.city,
        item.region,
        item.service_type,
        item.role,
        item.email,
    );

    const image =
        item.image ||
        item.profile_picture ||
        item.avatar ||
        item.thumbnail ||
        item.first_image ||
        item.logo ||
        null;

    const primaryId =
        item.id ??
        item.user_id ??
        item.guide_id ??
        item.agency_id ??
        item.destination_id ??
        `${category}-${index}`;

    const finalTitle = title || 'Untitled';

    return {
        id: String(primaryId),
        rawId: primaryId,
        category,
        title: finalTitle,
        subtitle,
        image,
        resultKey: `${category}-${primaryId}-${index}`,
        raw: item,
    };
};

const normalizeSearchResponse = (responseData) => {
    const groupedResults = createEmptyGroupedResults();
    const payload = extractSearchPayload(responseData);

    if (Array.isArray(payload)) {
        payload.forEach((item, index) => {
            const itemCategory = normalizeCategory(
                item?.result_type || item?.type || item?.entity_type || item?.category || item?.model,
            );

            const resolvedCategory = itemCategory || 'destinations';
            const normalizedItem = normalizeResultItem(item, resolvedCategory, index);
            if (normalizedItem) {
                groupedResults[resolvedCategory].push(normalizedItem);
            }
        });
        return groupedResults;
    }

    if (!payload || typeof payload !== 'object') {
        return groupedResults;
    }

    Object.entries(payload).forEach(([rawCategoryKey, rawCategoryItems]) => {
        const category = normalizeCategory(rawCategoryKey);
        if (!category) return;

        const categoryItems =
            Array.isArray(rawCategoryItems)
                ? rawCategoryItems
                : Array.isArray(rawCategoryItems?.results)
                    ? rawCategoryItems.results
                    : Array.isArray(rawCategoryItems?.data)
                        ? rawCategoryItems.data
                        : [];

        groupedResults[category] = categoryItems
            .map((item, index) => normalizeResultItem(item, category, index))
            .filter(Boolean);
    });

    return groupedResults;
};

const buildFallbackDestinationResults = (destinations, query) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return (destinations || [])
        .map((item) => {
            const name = pickFirstString(item?.name, item?.title);
            const location = pickFirstString(item?.location, item?.category);
            const searchable = `${name} ${location}`.toLowerCase();
            const score = getMatchScore(searchable, normalizedQuery);

            return {
                item,
                score,
            };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((entry, index) =>
            normalizeResultItem(
                {
                    ...entry.item,
                    destination_id: entry.item?.id,
                },
                'destinations',
                index,
            ),
        )
        .filter(Boolean);
};

const buildSections = (groupedResults, allowedCategories = CATEGORY_ORDER) =>
    allowedCategories
        .filter((category) => CATEGORY_CONFIG[category])
        .map((category) => ({
        key: category,
        title: CATEGORY_CONFIG[category].label,
        icon: CATEGORY_CONFIG[category].icon,
        color: CATEGORY_CONFIG[category].color,
        data: groupedResults[category] || [],
    }))
        .filter((section) => section.data.length > 0);

const isCancellationError = (error) =>
    error?.name === 'AbortError' ||
    error?.name === 'CanceledError' ||
    error?.code === 'ERR_CANCELED' ||
    String(error?.message || '').toLowerCase().includes('canceled');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightedText = ({ text, query, style, highlightStyle }) => {
    const safeText = typeof text === 'string' ? text : '';
    const safeQuery = query.trim();

    if (!safeQuery || !safeText) {
        return <Text style={style}>{safeText}</Text>;
    }

    const expression = new RegExp(`(${escapeRegExp(safeQuery)})`, 'ig');
    const parts = safeText.split(expression);

    return (
        <Text style={style}>
            {parts.map((part, index) => {
                const isMatch = part.toLowerCase() === safeQuery.toLowerCase();
                return (
                    <Text key={`${part}-${index}`} style={isMatch ? [style, highlightStyle] : style}>
                        {part}
                    </Text>
                );
            })}
        </Text>
    );
};

const HomeSearchBar = ({
    destinations = [],
    onSelectResult,
    placeholder = 'Search tourists, guides, agencies, destinations...',
    debounceMs = SEARCH_DEBOUNCE_MS,
    minQueryLength = MIN_QUERY_LENGTH,
    allowedCategories = CATEGORY_ORDER,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sections, setSections] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);

    const inputRef = useRef(null);
    const hasUserTypedRef = useRef(false);
    const skipNextSearchRef = useRef(false);
    const blurTimeoutRef = useRef(null);
    const requestCounterRef = useRef(0);
    const abortControllerRef = useRef(null);
    const cacheRef = useRef(new Map());

    const trimmedQuery = searchQuery.trim();

    const activeCategories = useMemo(
        () =>
            Array.isArray(allowedCategories) && allowedCategories.length > 0
                ? allowedCategories.filter((category) => CATEGORY_CONFIG[category])
                : CATEGORY_ORDER,
        [allowedCategories],
    );

    const flattenedResults = useMemo(
        () => sections.flatMap((section) => section.data),
        [sections],
    );

    const showRecentSearches = trimmedQuery.length === 0 && recentSearches.length > 0;
    const queryBelowMinimum = trimmedQuery.length > 0 && trimmedQuery.length < minQueryLength;
    const showLoadingState = trimmedQuery.length >= minQueryLength && isLoading;
    const showResultSections = trimmedQuery.length >= minQueryLength && !isLoading && sections.length > 0;
    const showEmptyState = trimmedQuery.length >= minQueryLength && !isLoading && sections.length === 0;
    const shouldShowDropdown =
        isDropdownOpen &&
        (showRecentSearches || queryBelowMinimum || showLoadingState || showResultSections || showEmptyState);

    const clearBlurTimeout = useCallback(() => {
        if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
    }, []);

    const saveRecentSearch = useCallback(async (value) => {
        const normalizedValue = value.trim();
        if (!normalizedValue) return;

        setRecentSearches((previous) => {
            const deduplicated = [
                normalizedValue,
                ...previous.filter((entry) => entry.toLowerCase() !== normalizedValue.toLowerCase()),
            ].slice(0, MAX_RECENT_SEARCHES);

            AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(deduplicated)).catch(() => null);

            return deduplicated;
        });
    }, []);

    const clearRecentSearches = useCallback(async () => {
        setRecentSearches([]);
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (error) {
            console.log('Unable to clear recent searches:', error);
        }
    }, []);

    const performSearch = useCallback(
        async (query) => {
            const normalizedQuery = query.trim().toLowerCase();
            if (normalizedQuery.length < minQueryLength) {
                setSections([]);
                setIsLoading(false);
                return;
            }

            const cachedSections = cacheRef.current.get(normalizedQuery);
            if (cachedSections) {
                setSections(cachedSections);
                setIsLoading(false);
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const requestId = requestCounterRef.current + 1;
            requestCounterRef.current = requestId;

            setIsLoading(true);

            try {
                const response = await api.get('/api/search/', {
                    params: { q: query },
                    signal: controller.signal,
                });

                const groupedApiResults = normalizeSearchResponse(response.data);
                const localDestinationFallback = buildFallbackDestinationResults(destinations, normalizedQuery);

                if (groupedApiResults.destinations.length === 0 && localDestinationFallback.length > 0) {
                    groupedApiResults.destinations = localDestinationFallback;
                }

                const nextSections = buildSections(groupedApiResults, activeCategories);
                cacheRef.current.set(normalizedQuery, nextSections);

                if (requestCounterRef.current === requestId && !controller.signal.aborted) {
                    setSections(nextSections);
                }
            } catch (error) {
                if (isCancellationError(error)) return;

                const groupedFallbackResults = createEmptyGroupedResults();
                groupedFallbackResults.destinations = buildFallbackDestinationResults(destinations, normalizedQuery);

                const fallbackSections = buildSections(groupedFallbackResults, activeCategories);
                cacheRef.current.set(normalizedQuery, fallbackSections);

                if (requestCounterRef.current === requestId) {
                    setSections(fallbackSections);
                }
            } finally {
                if (requestCounterRef.current === requestId && !controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [activeCategories, destinations, minQueryLength],
    );

    const handleResultSelect = useCallback(
        (result) => {
            if (!result) return;

            clearBlurTimeout();
            saveRecentSearch(result.title);
            skipNextSearchRef.current = true;
            setSearchQuery(result.title);
            setIsDropdownOpen(false);
            setIsFocused(false);
            setActiveIndex(-1);
            setIsLoading(false);

            if (inputRef.current) {
                inputRef.current.blur();
            }

            if (onSelectResult) {
                onSelectResult(result);
            }
        },
        [clearBlurTimeout, onSelectResult, saveRecentSearch],
    );

    const moveActiveIndex = useCallback(
        (direction) => {
            if (flattenedResults.length === 0) {
                setActiveIndex(-1);
                return;
            }

            setActiveIndex((previous) => {
                if (previous < 0) {
                    return direction > 0 ? 0 : flattenedResults.length - 1;
                }

                const nextIndex = previous + direction;

                if (nextIndex < 0) return flattenedResults.length - 1;
                if (nextIndex >= flattenedResults.length) return 0;
                return nextIndex;
            });
        },
        [flattenedResults],
    );

    const handleKeyPress = useCallback(
        ({ nativeEvent }) => {
            const key = String(nativeEvent?.key || '').toLowerCase();
            if (!key) return;

            if (key === 'arrowdown' || key === 'down') {
                setIsDropdownOpen(true);
                moveActiveIndex(1);
                return;
            }

            if (key === 'arrowup' || key === 'up') {
                setIsDropdownOpen(true);
                moveActiveIndex(-1);
                return;
            }

            if (key === 'enter' || key === 'return') {
                if (flattenedResults[activeIndex]) {
                    handleResultSelect(flattenedResults[activeIndex]);
                    return;
                }

                if (flattenedResults[0]) {
                    handleResultSelect(flattenedResults[0]);
                }

                return;
            }

            if (key === 'escape' || key === 'esc') {
                clearBlurTimeout();
                setIsDropdownOpen(false);
                setActiveIndex(-1);
                return;
            }
        },
        [activeIndex, clearBlurTimeout, flattenedResults, handleResultSelect, moveActiveIndex],
    );

    const handleSubmitEditing = useCallback(() => {
        if (flattenedResults[activeIndex]) {
            handleResultSelect(flattenedResults[activeIndex]);
            return;
        }

        if (flattenedResults[0]) {
            handleResultSelect(flattenedResults[0]);
            return;
        }

        if (trimmedQuery.length >= minQueryLength) {
            performSearch(trimmedQuery);
        }
    }, [activeIndex, flattenedResults, handleResultSelect, minQueryLength, performSearch, trimmedQuery]);

    const handleFocus = useCallback(() => {
        clearBlurTimeout();
        setIsFocused(true);
        setIsDropdownOpen(true);
    }, [clearBlurTimeout]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        blurTimeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
            setActiveIndex(-1);
        }, 120);
    }, []);

    const handleSearchInputChange = useCallback((value) => {
        hasUserTypedRef.current = true;
        setSearchQuery(value);
        setIsDropdownOpen(true);
    }, []);

    const handleClearQuery = useCallback(() => {
        skipNextSearchRef.current = true;
        hasUserTypedRef.current = false;
        setSearchQuery('');
        setSections([]);
        setIsLoading(false);
        setActiveIndex(-1);
        setIsDropdownOpen(true);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const handleRecentSearchPress = useCallback((value) => {
        hasUserTypedRef.current = true;
        skipNextSearchRef.current = false;
        setSearchQuery(value);
        setIsDropdownOpen(true);
        setIsFocused(true);
    }, []);

    useEffect(() => {
        const loadRecentSearches = async () => {
            try {
                const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setRecentSearches(parsed.filter((entry) => typeof entry === 'string'));
                    }
                }
            } catch (error) {
                console.log('Unable to load recent searches:', error);
            }
        };

        loadRecentSearches();
    }, []);

    useEffect(() => {
        cacheRef.current.clear();
    }, [destinations]);

    useEffect(() => {
        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            return;
        }

        if (!hasUserTypedRef.current) {
            return;
        }

        if (trimmedQuery.length < minQueryLength) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            setSections([]);
            setIsLoading(false);
            setActiveIndex(-1);
            return;
        }

        const timerId = setTimeout(() => {
            performSearch(trimmedQuery);
        }, debounceMs);

        return () => {
            clearTimeout(timerId);
        };
    }, [debounceMs, minQueryLength, performSearch, trimmedQuery]);

    useEffect(() => {
        if (flattenedResults.length === 0) {
            setActiveIndex(-1);
            return;
        }

        setActiveIndex((previous) => {
            if (previous >= 0 && previous < flattenedResults.length) {
                return previous;
            }
            return 0;
        });
    }, [flattenedResults]);

    useEffect(() => {
        return () => {
            clearBlurTimeout();

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [clearBlurTimeout]);

    return (
        <View style={styles.searchWrapper}>
            <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
                <Feather name="search" size={18} color={isFocused ? '#0284C7' : '#64748B'} />

                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={searchQuery}
                    onChangeText={handleSearchInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    onSubmitEditing={handleSubmitEditing}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Search tourists, guides, agencies, and destinations"
                    accessibilityHint="Type at least two characters to start searching"
                />

                {isLoading ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                ) : (
                    !!searchQuery && (
                        <TouchableOpacity
                            onPress={handleClearQuery}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search"
                            style={styles.clearButton}
                        >
                            <Feather name="x" size={17} color="#64748B" />
                        </TouchableOpacity>
                    )
                )}
            </View>

            {shouldShowDropdown && (
                <View style={styles.dropdownContainer} accessibilityRole="menu">
                    {showRecentSearches && (
                        <View style={styles.recentContainer}>
                            <View style={styles.recentHeader}>
                                <Text style={styles.recentTitle}>Recent searches</Text>
                                <TouchableOpacity onPress={clearRecentSearches} accessibilityRole="button">
                                    <Text style={styles.clearRecentText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.recentItemsWrap}>
                                {recentSearches.map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={styles.recentChip}
                                        onPressIn={clearBlurTimeout}
                                        onPress={() => handleRecentSearchPress(value)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Search recent term ${value}`}
                                    >
                                        <Feather name="clock" size={12} color="#64748B" />
                                        <Text style={styles.recentChipText}>{value}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {queryBelowMinimum && (
                        <View style={styles.stateContainer}>
                            <Text style={styles.stateTitle}>Keep typing</Text>
                            <Text style={styles.stateSubtitle}>Type at least {minQueryLength} characters to start searching.</Text>
                        </View>
                    )}

                    {showLoadingState && (
                        <View style={styles.stateContainer}>
                            <ActivityIndicator size="small" color="#0284C7" />
                            <Text style={styles.stateSubtitle}>Finding matches...</Text>
                        </View>
                    )}

                    {showEmptyState && (
                        <View style={styles.stateContainer}>
                            <Text style={styles.stateTitle}>No results found</Text>
                            <Text style={styles.stateSubtitle}>Try another keyword or broader phrase.</Text>
                        </View>
                    )}

                    {showResultSections && (
                        <ScrollView
                            style={styles.resultsScroll}
                            contentContainerStyle={styles.resultsContent}
                            keyboardShouldPersistTaps="always"
                            nestedScrollEnabled
                        >
                            {sections.map((section) => (
                                <View key={section.key} style={styles.sectionBlock}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIconBadge, { backgroundColor: `${section.color}1A` }]}>
                                            <Feather name={section.icon} size={12} color={section.color} />
                                        </View>
                                        <Text style={styles.sectionTitle}>{section.title}</Text>
                                        <Text style={styles.sectionCount}>{section.data.length}</Text>
                                    </View>

                                    {section.data.map((item) => {
                                        const isActive =
                                            activeIndex >= 0 &&
                                            flattenedResults[activeIndex]?.resultKey === item.resultKey;

                                        return (
                                            <TouchableOpacity
                                                key={item.resultKey}
                                                style={[styles.resultItem, isActive && styles.resultItemActive]}
                                                onPressIn={clearBlurTimeout}
                                                onPress={() => handleResultSelect(item)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Open ${item.title}`}
                                            >
                                                <Image
                                                    source={item.image ? { uri: item.image } : DEFAULT_IMAGE}
                                                    style={styles.resultImage}
                                                />

                                                <View style={styles.resultTextWrap}>
                                                    <HighlightedText
                                                        text={item.title}
                                                        query={trimmedQuery}
                                                        style={styles.resultTitle}
                                                        highlightStyle={styles.resultHighlight}
                                                    />

                                                    {!!item.subtitle && (
                                                        <HighlightedText
                                                            text={item.subtitle}
                                                            query={trimmedQuery}
                                                            style={styles.resultSubtitle}
                                                            highlightStyle={styles.resultHighlightSubtle}
                                                        />
                                                    )}
                                                </View>

                                                <Feather name="chevron-right" size={16} color="#94A3B8" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
};

export default HomeSearchBar;

const styles = StyleSheet.create({
    searchWrapper: {
        width: '100%',
        position: 'relative',
        zIndex: 101,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(241, 245, 249, 0.96)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.9)',
        paddingHorizontal: 14,
        height: 50,
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    searchBoxFocused: {
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        shadowOpacity: 0.15,
    },
    input: {
        marginLeft: 10,
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#0F172A',
    },
    clearButton: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E2E8F0',
    },
    dropdownContainer: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        maxHeight: 340,
        overflow: 'hidden',
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 12,
        zIndex: 102,
    },
    recentContainer: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    recentTitle: {
        color: '#334155',
        fontWeight: '700',
        fontSize: 13,
    },
    clearRecentText: {
        color: '#0284C7',
        fontSize: 12,
        fontWeight: '600',
    },
    recentItemsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    recentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recentChipText: {
        color: '#334155',
        fontSize: 12,
        fontWeight: '500',
    },
    stateContainer: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    stateTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    stateSubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    resultsScroll: {
        maxHeight: 320,
    },
    resultsContent: {
        paddingBottom: 8,
    },
    sectionBlock: {
        paddingTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingBottom: 8,
        paddingTop: 4,
    },
    sectionIconBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
        flex: 1,
    },
    sectionCount: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    resultItemActive: {
        backgroundColor: '#EFF6FF',
    },
    resultImage: {
        width: 40,
        height: 40,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: '#E2E8F0',
    },
    resultTextWrap: {
        flex: 1,
        marginRight: 8,
    },
    resultTitle: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '700',
    },
    resultSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#64748B',
    },
    resultHighlight: {
        color: '#0284C7',
    },
    resultHighlightSubtle: {
        color: '#0369A1',
        fontWeight: '700',
    },
});
