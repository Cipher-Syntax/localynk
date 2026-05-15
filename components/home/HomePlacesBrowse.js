import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import FallbackImage from '../../assets/localynk_images/discover1.png';
import NewPackageHighlightsModal from '../NewPackageHighlightsModal';
import { fetchDestinationHighlights } from '../../utils/newPackageHighlights';

import { styles } from './styles/HomePlacesBrowse.styles';

// ── Individual place card (Booking.com inspired) ──
const PlaceCard = ({ item, onPress, highlightCount = 0, onOpenHighlights }) => {
    const imageSource =
        item.image ||
        (item.images && item.images.length > 0 ? item.images[0].image : null) ||
        FallbackImage;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            {/* Photo */}
            <View style={styles.photoWrap}>
                <Image
                    source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
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

            {/* Info */}
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

// ── Main component ──
const HomePlacesBrowse = ({ isPublic = false, data = [] }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [destinationHighlightCounts, setDestinationHighlightCounts] = useState({});
    const [destinationHighlightsById, setDestinationHighlightsById] = useState({});
    const [highlightsTargetDate, setHighlightsTargetDate] = useState(null);
    const [highlightsModalVisible, setHighlightsModalVisible] = useState(false);
    const [selectedHighlightDestination, setSelectedHighlightDestination] = useState(null);

    const destinations = useMemo(() => data.slice(0, 12), [data]);

    useEffect(() => {
        let isMounted = true;
        const ids = destinations
            .map((d) => Number.parseInt(d?.id, 10))
            .filter((id) => Number.isFinite(id) && id > 0);

        if (ids.length === 0) {
            setDestinationHighlightCounts({});
            setDestinationHighlightsById({});
            return () => { isMounted = false; };
        }

        (async () => {
            try {
                const h = await fetchDestinationHighlights({ destinationIds: ids, limitPerDestination: 3 });
                if (!isMounted) return;
                setDestinationHighlightCounts(h.countsByDestinationId || {});
                setDestinationHighlightsById(h.byDestinationId || {});
                setHighlightsTargetDate(h.targetDate || null);
            } catch {
                if (!isMounted) return;
                setDestinationHighlightCounts({});
                setDestinationHighlightsById({});
            }
        })();
        return () => { isMounted = false; };
    }, [destinations]);

    const openPlaceHighlights = useCallback((destination) => {
        const key = String(destination?.id || '').trim();
        if (!key) return;
        const count = Number(destinationHighlightCounts[key] || 0);
        const entry = destinationHighlightsById[key];
        if (!entry || count <= 0) return;
        setSelectedHighlightDestination({
            destinationName: destination?.name || entry.destination_name,
            packages: Array.isArray(entry.packages) ? entry.packages : [],
        });
        setHighlightsModalVisible(true);
    }, [destinationHighlightCounts, destinationHighlightsById]);

    const getHighlightCount = useCallback(
        (id) => Number(destinationHighlightCounts[String(id)] || 0),
        [destinationHighlightCounts]
    );

    const handlePlacePress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({ pathname: '/(protected)/placesDetails', params: { id: item.id.toString() } });
        }
    };

    const handleViewAll = () => {
        const path = isPublic && !isAuthenticated ? '/auth/login' : '/(protected)/explore';
        router.push({ pathname: path, params: { tab: 'places' } });
    };

    // Pair destinations for 2-column layout
    const pairs = useMemo(() => {
        const result = [];
        for (let i = 0; i < destinations.length; i += 2) {
            result.push(destinations.slice(i, i + 2));
        }
        return result;
    }, [destinations]);

    const renderRow = ({ item: pair }) => (
        <View style={styles.row}>
            {pair.map((dest) => (
                <PlaceCard
                    key={dest.id}
                    item={dest}
                    onPress={() => handlePlacePress(dest)}
                    highlightCount={getHighlightCount(dest.id)}
                    onOpenHighlights={openPlaceHighlights}
                />
            ))}
            {/* Placeholder if odd number */}
            {pair.length === 1 && <View style={styles.cardPlaceholder} />}
        </View>
    );

    if (!destinations || destinations.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionLabel}>✦ EXPLORE</Text>
                    <Text style={styles.sectionTitle}>Discover Places</Text>
                </View>
                <TouchableOpacity style={styles.viewAllBtn} onPress={handleViewAll}>
                    <Text style={styles.viewAllText}>View all</Text>
                    <Ionicons name="chevron-forward" size={13} color="#0072FF" />
                </TouchableOpacity>
            </View>

            {/* Count badge */}
            <View style={styles.countRow}>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{destinations.length} places available</Text>
                </View>
            </View>

            {/* Grid */}
            <FlatList
                data={pairs}
                renderItem={renderRow}
                keyExtractor={(_, i) => i.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
            />

            <NewPackageHighlightsModal
                visible={highlightsModalVisible}
                onClose={() => setHighlightsModalVisible(false)}
                destinationName={selectedHighlightDestination?.destinationName}
                targetDate={highlightsTargetDate}
                packages={selectedHighlightDestination?.packages || []}
            />
        </View>
    );
};

export default HomePlacesBrowse;
