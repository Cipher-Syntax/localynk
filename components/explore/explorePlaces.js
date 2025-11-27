import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    Image,
    Text,
    TouchableOpacity,
    ImageBackground,
    Animated,
    Easing,
    TextInput,
    Dimensions,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/api';

// Dimensions for Bento Grid
const { width } = Dimensions.get('window');
const GAP = 10;
const PADDING = 16;
const LARGE_HEIGHT = 220;
const SMALL_HEIGHT = (LARGE_HEIGHT - GAP) / 2;

const ExplorePlaces = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [activeTab, setActiveTab] = useState(params.tab || 'guides');
    const [searchQuery, setSearchQuery] = useState('');
    const [guides, setGuides] = useState([]);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    const bounceValue = useRef(new Animated.Value(0)).current;

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

    useEffect(() => {
        startBounce();
    }, []);

    useEffect(() => {
        if (params.tab) {
            setActiveTab(params.tab);
        }
    }, [params.tab]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const guidesPromise = api.get('/api/guides/').catch(() => ({ data: [] }));
                const placesPromise = api.get('/api/destinations/').catch(() => ({ data: [] }));

                const [guidesRes, placesRes] = await Promise.all([guidesPromise, placesPromise]);

                if (isMounted) {
                    const guidesData = Array.isArray(guidesRes.data) ? guidesRes.data : (guidesRes.data?.results || []);
                    const placesData = Array.isArray(placesRes.data) ? placesRes.data : (placesRes.data?.results || []);

                    setGuides(guidesData);
                    setPlaces(placesData);
                }
            } catch (error) {
                console.error('Critical failure fetching data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false };
    }, []);

    const filteredGuides = guides.filter(guide => {
        const fullName = `${guide.first_name || ''} ${guide.last_name || ''}`.toLowerCase();
        const specialty = (guide.specialty || '').toLowerCase();
        const location = (guide.location || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || specialty.includes(query) || location.includes(query);
    });

    const filteredPlaces = places.filter(place =>
        (place.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const chunkData = (data, size) => {
        if (!data || !Array.isArray(data)) return [];
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    };

    const GuideCard = ({ item, style }) => (
        <TouchableOpacity
            style={[styles.bentoCard, styles.guideCardBento, style]}
            activeOpacity={0.9}
            onPress={() => router.push({
                pathname: "/(protected)/touristGuideDetails",
                params: { guideId: item.id },
            })}
        >
            <View style={styles.guideHeaderBento}>
                <View style={styles.iconWrapperSmall}><User size={20} color="#8B98A8" /></View>
                <View style={styles.guideRatingBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.guideRatingText}>{item.guide_rating || 'New'}</Text>
                </View>
            </View>
            <View style={styles.guideInfoBento}>
                <Text style={styles.guideNameBento} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.guideSpecialtyBento} numberOfLines={1}>{item.specialty || 'General Guide'}</Text>
                {style.height > 150 && (
                    <View style={styles.guideExtraBento}>
                        {/* <Text style={styles.guidePriceBento}>₱{item.price_per_day}/day</Text> */}
                        <Text style={styles.guideLocBento} numberOfLines={1}>
                            <Ionicons name="location-outline" size={10} /> {item.location}
                        </Text>
                        <View style={styles.bookButtonSmall}>
                            <Text style={styles.bookButtonTextSmall}>View Profile</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const PlaceCard = ({ item, style }) => {
        const imageSource = item.image || item.first_image || item.thumbnail
            ? { uri: item.image || item.first_image || item.thumbnail }
            : null;
        return (
            <TouchableOpacity
                style={[styles.bentoCard, style]}
                activeOpacity={0.9}
                onPress={() => router.push({
                    pathname: "/(protected)/placesDetails",
                    params: { id: item.id.toString(), image: item.image || item.first_image || '' },
                })}
            >
                <ImageBackground source={imageSource} style={styles.placeImageBento} imageStyle={{ borderRadius: 15 }}>
                    <View style={styles.placeOverlayBento} />
                    <View style={styles.placeContentBento}>
                        <Text style={styles.placeNameBento} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.placeLocRow}>
                            <Ionicons name="location" size={10} color="#00C6FF" />
                            <Text style={styles.placeLocText} numberOfLines={1}>{item.location || 'Zamboanga City'}</Text>
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        );
    };

    const renderBentoRow = ({ item: chunk, index }) => {
        if (!chunk || chunk.length === 0) return null;
        const isBigLeft = index % 2 === 0;
        const CardComponent = activeTab === 'guides' ? GuideCard : PlaceCard;

        return (
            <View style={styles.rowContainer}>
                {chunk.length === 3 ? (
                    isBigLeft ? (
                        <>
                            <CardComponent item={chunk[0]} style={{ width: '65%', height: LARGE_HEIGHT }} />
                            <View style={styles.columnContainer}>
                                <CardComponent item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                                <CardComponent item={chunk[2]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.columnContainer}>
                                <CardComponent item={chunk[0]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                                <CardComponent item={chunk[1]} style={{ width: '100%', height: SMALL_HEIGHT }} />
                            </View>
                            <CardComponent item={chunk[2]} style={{ width: '65%', height: LARGE_HEIGHT }} />
                        </>
                    )
                ) : chunk.length === 2 ? (
                    <>
                        <CardComponent item={chunk[0]} style={{ width: '48.5%', height: LARGE_HEIGHT }} />
                        <CardComponent item={chunk[1]} style={{ width: '48.5%', height: LARGE_HEIGHT }} />
                    </>
                ) : (
                    <CardComponent item={chunk[0]} style={{ width: '100%', height: LARGE_HEIGHT * 0.8 }} />
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                <Text style={styles.headerTitle}>EXPLORE {activeTab === 'guides' ? 'GUIDES' : 'PLACES'}</Text>
            </View>

            <View style={styles.searchFilterRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#8B98A8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'guides' ? "Search guides by name, specialty..." : "Search places..."}
                        placeholderTextColor="#8B98A8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => alert("Filter options coming soon!")}>
                    <Ionicons name="options-outline" size={22} color="#00A8FF" />
                </TouchableOpacity>
            </View>

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
        </View>
    );

    const renderEmpty = () => {
        if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00A8FF" /></View>;
        return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No results found.</Text></View>;
    };

    const displayData = activeTab === 'guides' ? filteredGuides : filteredPlaces;
    const bentoChunks = chunkData(displayData, 3);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <FlatList
                key={activeTab}
                data={bentoChunks}
                renderItem={renderBentoRow}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.contentContainer}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default ExplorePlaces;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { alignItems: 'center', marginTop: 50 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#8B98A8', fontSize: 16 },
    header: { position: 'relative', height: 120, justifyContent: 'center', width: '100%' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    searchFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF0F5', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D0DAE3' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1A2332' },
    filterButton: { backgroundColor: '#EBF0F5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D0DAE3' },
    toggleRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
    toggleContainer: { flexDirection: 'row', width: '100%', gap: 12 },
    toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00A8FF', backgroundColor: '#fff', alignItems: 'center' },
    toggleButtonActive: { backgroundColor: '#00A8FF' },
    toggleButtonText: { fontSize: 14, fontWeight: '600', color: '#00A8FF' },
    toggleButtonTextActive: { color: '#fff' },
    contentContainer: { paddingBottom: 40 },
    rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: GAP, marginHorizontal: PADDING },
    columnContainer: { width: '32%', justifyContent: 'space-between', height: LARGE_HEIGHT },
    bentoCard: { borderRadius: 15, overflow: 'hidden', backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E6ED', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    guideCardBento: { padding: 12, justifyContent: 'space-between' },
    guideHeaderBento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconWrapperSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center' },
    guideRatingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C99700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
    guideRatingText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    guideInfoBento: { marginTop: 8 },
    guideNameBento: { fontSize: 14, fontWeight: '700', color: '#1A2332' },
    guideSpecialtyBento: { fontSize: 11, color: '#8B98A8', marginTop: 2 },
    guideExtraBento: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E6ED' },
    guidePriceBento: { fontSize: 12, fontWeight: '600', color: '#00A8FF' },
    guideLocBento: { fontSize: 10, color: '#8B98A8', marginTop: 2 },
    bookButtonSmall: { marginTop: 8, backgroundColor: '#00A8FF', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
    bookButtonTextSmall: { color: '#fff', fontSize: 10, fontWeight: '700' },
    placeImageBento: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    placeOverlayBento: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15 },
    placeContentBento: { padding: 10 },
    placeNameBento: { color: '#fff', fontSize: 14, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3, marginBottom: 4 },
    placeLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    placeLocText: { color: '#eee', fontSize: 10, flex: 1 },
});
