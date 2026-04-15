import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import FallbackImage from '../../assets/localynk_images/discover1.png';
import NewPackageHighlightsModal from '../NewPackageHighlightsModal';
import { fetchDestinationHighlights } from '../../utils/newPackageHighlights';

const GAP = 10;
const PADDING = 15;
const LARGE_HEIGHT = 220; 
const SMALL_HEIGHT = (LARGE_HEIGHT - GAP) / 2;

const PlaceCard = ({ item, style, onPress, highlightCount = 0, onOpenHighlights }) => {
    const imageSource = item.image || (item.images && item.images.length > 0 ? item.images[0].image : null) || FallbackImage;

    return (
        <TouchableOpacity style={[styles.placeCard, style]} onPress={onPress} activeOpacity={0.9}>
            <Image source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource} style={styles.placeImage} resizeMode="cover" />
            
            {/* --- CATEGORY BADGE --- */}
            {item.category && (
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
            )}

            {highlightCount > 0 && (
                <TouchableOpacity
                    style={styles.newPackageBadge}
                    onPress={(event) => {
                        event?.stopPropagation?.();
                        onOpenHighlights?.(item);
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="sparkles-outline" size={10} color="#fff" />
                    <View style={styles.newPackageBadgeTextWrap}>
                        <Text style={styles.newPackageBadgeText} numberOfLines={1}>NEW TOUR PACKAGE {highlightCount}</Text>
                        <Text style={styles.newPackageTapHint} numberOfLines={1}>TAP FOR DETAILS</Text>
                    </View>
                </TouchableOpacity>
            )}

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
            
            <View style={styles.infoOverlay}>
                <View style={styles.nameRow}>
                    <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                    {item.average_rating && (
                         <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={8} color="#FFD700" />
                            <Text style={styles.ratingText}>{parseFloat(item.average_rating).toFixed(1)}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={10} color="#fff" />
                    <Text style={styles.placeLocation} numberOfLines={1}>{item.location || 'Zamboanga City'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

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

        const destinationIds = destinations
            .map((destination) => Number.parseInt(destination?.id, 10))
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
    }, [destinations]);

    const openPlaceHighlights = useCallback((destination) => {
        const destinationKey = String(destination?.id || '').trim();
        if (!destinationKey) return;

        const highlightCount = Number(destinationHighlightCounts[destinationKey] || 0);
        const entry = destinationHighlightsById[destinationKey];

        if (!entry || highlightCount <= 0) return;

        setSelectedHighlightDestination({
            destinationName: destination?.name || entry.destination_name,
            packages: Array.isArray(entry.packages) ? entry.packages : [],
        });
        setHighlightsModalVisible(true);
    }, [destinationHighlightCounts, destinationHighlightsById]);

    const getHighlightCount = useCallback((destinationId) => {
        return Number(destinationHighlightCounts[String(destinationId)] || 0);
    }, [destinationHighlightCounts]);

    const handlePlacePress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: '/(protected)/placesDetails',
                params: { id: item.id.toString() },
            });
        }
    };

    const handleViewAll = () => {
        const path = isPublic && !isAuthenticated ? '/auth/login' : '/(protected)/explore';
        router.push({ pathname: path, params: { tab: 'places' } });
    };

    const chunkData = (data, size) => {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
        return chunks;
    };

    const renderBentoRow = ({ item: chunk, index }) => {
        if (!chunk || chunk.length === 0) return null;
        const isBigLeft = index % 2 === 0;

        if (chunk.length === 3) {
            return (
                <View style={styles.rowContainer}>
                    {isBigLeft ? (
                        <>
                            <PlaceCard item={chunk[0]} style={{ width: '65%', height: LARGE_HEIGHT }} onPress={() => handlePlacePress(chunk[0])} highlightCount={getHighlightCount(chunk[0]?.id)} onOpenHighlights={openPlaceHighlights} />
                            <View style={styles.columnContainer}>
                                <PlaceCard item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} onPress={() => handlePlacePress(chunk[1])} highlightCount={getHighlightCount(chunk[1]?.id)} onOpenHighlights={openPlaceHighlights} />
                                <PlaceCard item={chunk[2]} style={{ width: '100%', height: SMALL_HEIGHT }} onPress={() => handlePlacePress(chunk[2])} highlightCount={getHighlightCount(chunk[2]?.id)} onOpenHighlights={openPlaceHighlights} />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.columnContainer}>
                                <PlaceCard item={chunk[0]} style={{ width: '100%', height: SMALL_HEIGHT }} onPress={() => handlePlacePress(chunk[0])} highlightCount={getHighlightCount(chunk[0]?.id)} onOpenHighlights={openPlaceHighlights} />
                                <PlaceCard item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} onPress={() => handlePlacePress(chunk[1])} highlightCount={getHighlightCount(chunk[1]?.id)} onOpenHighlights={openPlaceHighlights} />
                            </View>
                            <PlaceCard item={chunk[2]} style={{ width: '65%', height: LARGE_HEIGHT }} onPress={() => handlePlacePress(chunk[2])} highlightCount={getHighlightCount(chunk[2]?.id)} onOpenHighlights={openPlaceHighlights} />
                        </>
                    )}
                </View>
            );
        }
        if (chunk.length === 2) {
            return (
                <View style={styles.rowContainer}>
                    <PlaceCard item={chunk[0]} style={{ width: '48.5%', height: LARGE_HEIGHT }} onPress={() => handlePlacePress(chunk[0])} highlightCount={getHighlightCount(chunk[0]?.id)} onOpenHighlights={openPlaceHighlights} />
                    <PlaceCard item={chunk[1]} style={{ width: '48.5%', height: LARGE_HEIGHT }} onPress={() => handlePlacePress(chunk[1])} highlightCount={getHighlightCount(chunk[1]?.id)} onOpenHighlights={openPlaceHighlights} />
                </View>
            );
        }
        if (chunk.length === 1) {
            return (
                <View style={styles.rowContainer}>
                    <PlaceCard item={chunk[0]} style={{ width: '100%', height: LARGE_HEIGHT * 0.8 }} onPress={() => handlePlacePress(chunk[0])} highlightCount={getHighlightCount(chunk[0]?.id)} onOpenHighlights={openPlaceHighlights} />
                </View>
            );
        }
        return null;
    };

    if (!destinations || destinations.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Discover Places</Text>
                    <Text style={styles.subtitle}>Curated spots for you</Text>
                </View>
                <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0072FF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={chunkData(destinations, 3)}
                renderItem={renderBentoRow}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
    container: { marginTop: 20, marginBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: PADDING, marginBottom: 16 },
    headerLeft: { flex: 1, marginRight: 10 },
    title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
    subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
    viewAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F8FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    viewAllText: { fontSize: 12, fontWeight: '600', color: '#0072FF', marginRight: 4 },
    listContent: { paddingHorizontal: PADDING },
    rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: GAP, width: '100%' },
    columnContainer: { width: '32%', justifyContent: 'space-between', height: LARGE_HEIGHT },
    placeCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0f0f0', elevation: 2, position: 'relative' },
    placeImage: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', zIndex: 1 },
    infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, zIndex: 2 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    placeName: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1, marginRight: 5, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowRadius: 3 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    placeLocation: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginLeft: 4, flex: 1, fontWeight: '500' },
    
    // --- Badge Styles ---
    categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 5 },
    categoryText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    newPackageBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        backgroundColor: 'rgba(2,132,199,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(186,230,253,0.95)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
        zIndex: 6,
        maxWidth: '82%',
    },
    newPackageBadgeTextWrap: { flexShrink: 1 },
    newPackageBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', lineHeight: 10 },
    newPackageTapHint: { color: '#E0F2FE', fontSize: 7, fontWeight: '700', lineHeight: 9, marginTop: 1 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    ratingText: { color: '#fff', fontSize: 9, fontWeight: '700', marginLeft: 2 }
});

export default HomePlacesBrowse;