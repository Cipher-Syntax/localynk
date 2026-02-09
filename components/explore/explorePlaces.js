import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Image, Text, TouchableOpacity, Animated, Easing, TextInput, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/api';

// Fallback image if none exists
const FALLBACK_IMAGE = require('../../assets/localynk_images/discover1.png'); 

const { width } = Dimensions.get('window');
const GAP = 12;
const PADDING = 16;
const LARGE_HEIGHT = 280;
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

    const GuideCardStack = ({ item }) => (
        <View style={styles.guideCardStack}>
            <View style={styles.cardProfileSection}>
                <View style={styles.iconWrapper}>
                    <User size={40} color="#8B98A8" />
                </View>
                
                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.guideName}>{item.first_name} {item.last_name}</Text>
                        {renderAvailability(item.available_days)}
                    </View>
                    
                    <Text style={styles.guideAddress}>{item.location || 'Zamboanga City'}</Text>
                    <Text style={styles.guideRating}>
                        {item.guide_rating || 'New'} <Ionicons name="star" size={12} color="#C99700" />
                    </Text>
                </View>

                <TouchableOpacity>
                    <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
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
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.detailValue}>₱{item.price_per_day || 'N/A'}/day</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.buttonContainer} 
                activeOpacity={0.8} 
                onPress={() => router.push({
                    pathname: "/(protected)/touristGuideDetails",
                    params: { guideId: item.id },
                })}
            >
                <Text style={styles.bookButton}>VIEW PROFILE</Text>
            </TouchableOpacity>
        </View>
    );

    // --- UPDATED PLACE CARD COMPONENT (Matches HomePlacesBrowse) ---
    const PlaceCardBento = ({ item, style }) => {
        const imageSource = item.image || item.first_image || item.thumbnail
            ? { uri: item.image || item.first_image || item.thumbnail }
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
                
                {/* --- CATEGORY BADGE --- */}
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}

                {/* --- GRADIENT & INFO --- */}
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
                <Text style={styles.headerTitle}>EXPLORE {activeTab === 'guides' ? 'GUIDES' : 'PLACES'}</Text>
            </View>

            <View style={styles.searchFilterRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#8B98A8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'guides' ? "Search guides..." : "Search places..."}
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

    const displayData = activeTab === 'guides' ? filteredGuides : chunkData(filteredPlaces, 3);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <FlatList
                key={activeTab}
                data={displayData}
                renderItem={renderItem}
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
    columnContainer: { width: '33%', justifyContent: 'space-between', height: LARGE_HEIGHT },

    // --- NEW PLACE CARD STYLES ---
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
    
    // Badge Styles
    categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 5 },
    categoryText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    
    ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    ratingText: { color: '#fff', fontSize: 9, fontWeight: '700', marginLeft: 2 },

    // --- GUIDE CARD STYLES ---
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
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center' },
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
});