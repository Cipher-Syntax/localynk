import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Lock } from "lucide-react-native"; // Added Lock icon
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const GuideSelection = () => {
    const { placeId, placeName } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [guides, setGuides] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [guideImageErrors, setGuideImageErrors] = useState({});
    
    // Modals
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [limitModalVisible, setLimitModalVisible] = useState(false); // NEW STATE

    const toGuideIdKey = (guideId) => String(guideId ?? '').trim();

    const toGuideIdPayload = (guideIdKey) => {
        const numericId = Number(guideIdKey);
        return Number.isFinite(numericId) ? numericId : guideIdKey;
    };

    useEffect(() => {
        const fetchGuidesAndFavorites = async () => {
            if (!placeId || placeId === 'undefined' || placeId === 'null') {
                console.log("Invalid Place ID, skipping fetch");
                setLoading(false);
                return;
            }

            try {
                // Fetch guides for the location
                const guidesResponse = await api.get(`/api/guide-list/?main_destination=${placeId}`);
                const guidesData = Array.isArray(guidesResponse.data) ? guidesResponse.data : [];
                setGuides(guidesData);
                
                // Fetch user's existing favorites
                const favoritesResponse = await api.get('/api/favorites/');
                const favoriteIds = new Set(
                    (Array.isArray(favoritesResponse.data) ? favoritesResponse.data : [])
                        .map((guide) => toGuideIdKey(guide?.id ?? guide?.guide_id))
                        .filter(Boolean),
                );
                setFavorites(favoriteIds);

            } catch (error) {
                console.error('Failed to fetch data:', error);
                setGuides([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchGuidesAndFavorites();
    }, [placeId]);

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
        } catch (error) {
            const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
            const suffix = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
            return `${prefix}${suffix}`;
        }
    };

    const getGuideImagePath = (guide) =>
        guide?.profile_picture || guide?.profile_image || guide?.avatar || null;

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

    const getGuideMaxGuestsLabel = (guide) => {
        const tours = Array.isArray(guide?.tours) ? guide.tours : [];
        const maxGuestsFromTours = tours.reduce((max, tour) => {
            const pax = parseInt(tour?.max_group_size, 10);
            return Number.isFinite(pax) && pax > max ? pax : max;
        }, 0);

        const maxGuestsFromGuide = [
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

        const maxGuests = Math.max(maxGuestsFromTours, maxGuestsFromGuide);

        return maxGuests > 0 ? `${maxGuests} guests` : 'Per package';
    };

    const getGuideBusyState = (guide) => {
        if (typeof guide?.is_busy === 'boolean') {
            return guide.is_busy;
        }
        const activeCount = Number(guide?.active_bookings_count || 0);
        return guide?.guide_tier !== 'paid' && activeCount >= 1;
    };

    const handleChooseGuide = (guide) => {
        // 1. Prevent booking yourself
        if (user && guide && String(user.id) === String(guide.id)) {
            console.log("MATCH DETECTED! You cannot book yourself.");
            setErrorModalVisible(true);
            return;
        }

        // 2. NEW CHECK: Free Tier Limit
        // Note: Ensure your API returns 'guide_tier' and 'active_bookings_count' (or similar logic)
        const isFreeTier = guide.guide_tier !== 'paid'; 
        const hasActiveBooking = getGuideBusyState(guide);

        if (isFreeTier && hasActiveBooking) {
            setLimitModalVisible(true);
            return;
        }

        // 3. Proceed if clear
        router.push({
            pathname: "/(protected)/guideAvailability",
            params: { 
                guideId: guide.id, 
                guideName: guide.guide_name || `${guide.first_name} ${guide.last_name}`,
                itinerary: guide.tour_itinerary || '',
                availableDays: JSON.stringify(guide.available_days || []),
                placeId: placeId,
                placeName: placeName
            }
        });
    };

    const toggleFavorite = async (guideId) => {
        const guideIdKey = toGuideIdKey(guideId);
        if (!guideIdKey) return;

        try {
            await api.post('/api/favorites/toggle/', { guide_id: toGuideIdPayload(guideIdKey) });
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (newFavorites.has(guideIdKey)) {
                    newFavorites.delete(guideIdKey);
                } else {
                    newFavorites.add(guideIdKey);
                }
                return newFavorites;
            });
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const filteredGuides = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return guides.filter((guide) => {
            const isBusy = getGuideBusyState(guide);
            const statusPass = statusFilter === 'all'
                ? true
                : statusFilter === 'available'
                    ? !isBusy
                    : isBusy;

            if (!statusPass) return false;

            if (!query) return true;

            const guideName = guide.guide_name || `${guide.first_name || ''} ${guide.last_name || ''}`;
            const haystack = [
                guideName,
                guide.location,
                guide.specialty,
                Array.isArray(guide.languages) ? guide.languages.join(' ') : guide.languages,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [guides, searchQuery, statusFilter]);
    
    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' }}>
                    <View style={{ width: 150, height: 20, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                    <View style={{ width: 100, height: 14, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                </View>
                <View style={{ padding: 16, gap: 12 }}>
                    {[1, 2].map(i => (
                        <View key={i} style={{ backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' }}>
                            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E6ED' }} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ width: 120, height: 18, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                                    <View style={{ width: 150, height: 12, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 6 }} />
                                    <View style={{ width: 80, height: 12, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                {[1, 2, 3, 4].map(j => (
                                    <View key={j} style={{ width: '48%', height: 45, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }} />
                                ))}
                            </View>
                            <View style={{ width: '100%', height: 45, backgroundColor: '#E0E6ED', borderRadius: 8 }} />
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (guides.length === 0) {
        return (
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

                    <Text style={styles.headerTitle}>EXPLORE PERFECT GUIDE FOR YOU</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No guides available for {placeName} yet.</Text>
                    <Text style={styles.emptySubtext}>Check back soon!</Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}> 
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

                    <Text style={styles.headerTitle}>EXPLORE PERFECT GUIDE FOR YOU</Text>
                </View>

                <View style={styles.destinationInfo}>
                    <Text style={styles.destinationName}>{placeName}</Text>
                    <Text style={styles.guideCount}>
                        Showing {filteredGuides.length} of {guides.length} guide{guides.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                <View style={styles.filterCard}>
                    <View style={styles.searchInputWrap}>
                        <Ionicons name="search" size={16} color="#64748B" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search guide by name, specialty, language"
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                        />
                        {!!searchQuery && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterChipRow}>
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'available', label: 'Available' },
                            { key: 'busy', label: 'Busy' },
                        ].map((chip) => (
                            <TouchableOpacity
                                key={chip.key}
                                onPress={() => setStatusFilter(chip.key)}
                                style={[styles.filterChip, statusFilter === chip.key && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, statusFilter === chip.key && styles.filterChipTextActive]}>{chip.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {filteredGuides.length === 0 && (
                        <View style={styles.filteredEmptyContainer}>
                            <Ionicons name="search-outline" size={36} color="#CBD5E1" />
                            <Text style={styles.filteredEmptyText}>No guides match your current filters.</Text>
                        </View>
                    )}

                    {filteredGuides.map((guide, index) => {
                         // Optional: Visually indicate they are busy
                         const isBusy = getGuideBusyState(guide);
                        const guideName = guide.guide_name || `${guide.first_name || ''} ${guide.last_name || ''}`;
                        const guideIdKey = toGuideIdKey(guide.id || guide.user_id);
                        const guideImageKey = String(guide.id || guide.user_id || guideName || index);
                         const guideImageUri = getImageUrl(getGuideImagePath(guide));
                        const showGuideImage = Boolean(guideImageUri && !guideImageErrors[guideImageKey]);
                         
                         return (
                            <View key={guide.id || index} style={[styles.guideCard, isBusy && styles.guideCardBusy]}>
                                <View style={styles.cardProfileSection}>
                                    <View style={[styles.iconWrapper, showGuideImage && styles.imageWrapper]}>
                                        {showGuideImage ? (
                                            <Image 
                                                source={{ uri: guideImageUri }} 
                                                style={[styles.profileImage, isBusy && { opacity: 0.5 }]}
                                                onError={() => markGuideImageError(guideImageKey)}
                                            />
                                        ) : (
                                            <User size={40} color="#8B98A8" />
                                        )}
                                    </View>
                                    
                                    <View style={styles.profileInfo}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.guideName}>{guideName}</Text>
                                            {isBusy && (
                                                <View style={styles.busyBadge}>
                                                    <Text style={styles.busyText}>Busy</Text>
                                                </View>
                                            )}
                                            {!isBusy && renderAvailability(guide.available_days)}
                                        </View>
                                        
                                        <Text style={styles.guideAddress}>{guide.location || 'Location not specified'}</Text>
                                        <Text style={styles.guideRating}>
                                            {guide.guide_rating || 'New'} <Ionicons name="star" size={12} color="#C99700" />
                                        </Text>
                                    </View>

                                    <TouchableOpacity onPress={() => toggleFavorite(guide.id)}>
                                        <Ionicons 
                                            name={favorites.has(guideIdKey) ? "heart" : "heart-outline"} 
                                            size={22} 
                                            color="#FF5A5F" 
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Language</Text>
                                        <Text style={styles.detailValue}>
                                            {Array.isArray(guide.languages) 
                                                ? guide.languages.join(', ') 
                                                : guide.languages || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Specialty</Text>
                                        <Text style={styles.detailValue}>{guide.specialty || 'General'}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Experience</Text>
                                        <Text style={styles.detailValue}>{guide.experience_years || 0} years</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Max Guests</Text>
                                        <Text style={styles.detailValue}>{getGuideMaxGuestsLabel(guide)}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={[styles.buttonContainer, isBusy && styles.buttonBusy]} 
                                    activeOpacity={0.8} 
                                    onPress={() => handleChooseGuide(guide)}
                                >
                                    <Text style={styles.bookButton}>
                                        {isBusy ? "GUIDE UNAVAILABLE" : "CHOOSE THIS GUIDE"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* ERROR MODAL (Self Booking) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={errorModalVisible}
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="alert-circle" size={48} color="#FF5252" />
                        </View>
                        <Text style={styles.modalTitle}>Action Not Allowed</Text>
                        <Text style={styles.modalMessage}>
                            You cannot book your own tour. Please switch to a different account to proceed with a booking.
                        </Text>
                        <TouchableOpacity 
                            style={styles.modalButton}
                            onPress={() => setErrorModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* NEW MODAL: FREE TIER LIMIT REACHED */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={limitModalVisible}
                onRequestClose={() => setLimitModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIconContainer, { backgroundColor: '#E3F2FD' }]}>
                            <Lock size={40} color="#0072FF" />
                        </View>
                        <Text style={styles.modalTitle}>Guide Unavailable</Text>
                        <Text style={styles.modalMessage}>
                            This guide is currently fully booked.{"\n\n"}
                            They are on the Starter (Free) Tier and have reached their active booking limit. Please choose another guide or try again later when they are free.
                        </Text>
                        <TouchableOpacity 
                            style={[styles.modalButton, { backgroundColor: '#0072FF' }]}
                            onPress={() => setLimitModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default GuideSelection;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
    emptyText: { fontSize: 18, color: '#1A2332', fontWeight: '600', textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: '#8B98A8', marginTop: 8, textAlign: 'center' },
    
    header: { height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700' },
    
    backButton: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        padding: 5, 
        zIndex: 10 
    },

    destinationInfo: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
    destinationName: { fontSize: 18, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideCount: { fontSize: 13, color: '#8B98A8' },

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
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
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
    
    contentContainer: { padding: 16, gap: 12 },
    filteredEmptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    filteredEmptyText: {
        marginTop: 10,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },
    
    guideCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 10 },
    guideCardBusy: { backgroundColor: '#FAFAFA', borderColor: '#EEE', opacity: 0.9 }, // Style for busy guides

    cardProfileSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imageWrapper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
    profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    profileInfo: { flex: 1, marginLeft: 12 },
    
    nameRow: { flexDirection: 'column', alignItems: 'flex-start' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideAddress: { fontSize: 12, color: '#8B98A8' },
    guideRating: { fontSize: 12, color: '#C99700', marginTop: 2 },
    
    // Busy Badge Styles
    busyBadge: { backgroundColor: '#CFD8DC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    busyText: { fontSize: 10, color: '#455A64', fontWeight: '700', textTransform: 'uppercase' },

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
    buttonBusy: { opacity: 0.6 },
    bookButton: { backgroundColor: '#00C6FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', width: '100%', overflow: 'hidden' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
    modalIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#253347', marginBottom: 8, textAlign: 'center' },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalButton: { backgroundColor: '#253347', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' },
    modalButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
