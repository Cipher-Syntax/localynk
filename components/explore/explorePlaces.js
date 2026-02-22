import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, Image, Text, TouchableOpacity, Animated, Easing, TextInput, Dimensions, FlatList, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/api';

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
    const [selectedCategory, setSelectedCategory] = useState(params.category || ''); 
    const [searchQuery, setSearchQuery] = useState('');
    
    // NEW: Filter States
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [maxGuidePrice, setMaxGuidePrice] = useState('');
    const [selectedGuideLocation, setSelectedGuideLocation] = useState('');

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

    // Watch for params changes if navigated from other tabs
    useEffect(() => {
        if (params.tab) setActiveTab(params.tab);
        if (params.category) setSelectedCategory(params.category);
    }, [params.tab, params.category]);

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

    // UPDATED: Apply Guide Filters
    const filteredGuides = guides.filter(guide => {
        const fullName = `${guide.first_name || ''} ${guide.last_name || ''}`.toLowerCase();
        const specialty = (guide.specialty || '').toLowerCase();
        const loc = (guide.location || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        const matchesSearch = fullName.includes(query) || specialty.includes(query) || loc.includes(query);
        const matchesLocation = selectedGuideLocation ? loc.includes(selectedGuideLocation.toLowerCase()) : true;
        
        const guidePrice = parseFloat(guide.price_per_day) || 0;
        const matchesPrice = maxGuidePrice ? guidePrice <= parseFloat(maxGuidePrice) : true;
        
        const guideRating = parseFloat(guide.guide_rating) || 0;
        const matchesRating = minRating > 0 ? guideRating >= minRating : true;

        return matchesSearch && matchesLocation && matchesPrice && matchesRating;
    });

    // UPDATED: Apply Places Filters
    const filteredPlaces = places.filter(place => {
        const matchesSearch = (place.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? place.category === selectedCategory : true;
        
        const placeRating = parseFloat(place.average_rating) || 0;
        const matchesRating = minRating > 0 ? placeRating >= minRating : true;

        return matchesSearch && matchesCategory && matchesRating;
    });

    const chunkData = (data, size) => {
        if (!data || !Array.isArray(data)) return [];
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    };

    // Helper: Check if there are any active filters to display the clear badge
    const hasActiveFilters = selectedCategory !== '' || minRating > 0 || (activeTab === 'guides' && (maxGuidePrice !== '' || selectedGuideLocation !== ''));

    const clearAllFilters = () => {
        setSelectedCategory('');
        setMinRating(0);
        setMaxGuidePrice('');
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
                    EXPLORE {activeTab === 'guides' ? 'GUIDES' : (selectedCategory ? selectedCategory.toUpperCase() : 'PLACES')}
                </Text>
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
                
                {/* UPDATED: Open Filter Modal Instead of Alert */}
                <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                    <Ionicons name="options-outline" size={22} color="#00A8FF" />
                    {hasActiveFilters && <View style={styles.filterActiveDot} />}
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

            {/* UPDATED: Dynamic Filter Badge that shows if ANY filter is active */}
            {hasActiveFilters && (
                <View style={styles.activeFilterContainer}>
                    <Text style={styles.activeFilterText}>
                        Filters applied {selectedCategory && activeTab === 'places' ? `(${selectedCategory})` : ''}
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

            {/* NEW: Filter Bottom Sheet Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
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
                                        {/* Get unique categories from fetched places */}
                                        {Array.from(new Set(places.map(p => p.category).filter(Boolean))).map(cat => (
                                            <TouchableOpacity 
                                                key={cat} 
                                                style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                                                onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                                            >
                                                <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {activeTab === 'guides' && (
                                <>
                                    <Text style={styles.filterSectionTitle}>Maximum Price (₱/day)</Text>
                                    <TextInput
                                        style={styles.filterInput}
                                        placeholder="e.g. 1500"
                                        placeholderTextColor="#8B98A8"
                                        keyboardType="numeric"
                                        value={maxGuidePrice}
                                        onChangeText={setMaxGuidePrice}
                                    />

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
                </View>
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

    // FILTER MODAL STYLES
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

    filterInput: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 10, padding: 12, fontSize: 15, color: '#1A2332' },

    modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E6ED' },
    modalClearButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EBF0F5', alignItems: 'center' },
    modalClearButtonText: { fontSize: 15, fontWeight: '600', color: '#1A2332' },
    modalApplyButton: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00A8FF', alignItems: 'center' },
    modalApplyButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});