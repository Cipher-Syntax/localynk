import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ViewAccommodations() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const userId = params.userId || currentUser?.id;

    const [loading, setLoading] = useState(true);
    const [guide, setGuide] = useState(null);
    const [accommodations, setAccommodations] = useState([]);
    const [tours, setTours] = useState([]);
    const [error, setError] = useState(null);

    // Helper to fix image URLs
    const getImageUrl = (imgPath) => {
        if (!imgPath) return 'https://via.placeholder.com/400x250';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    useEffect(() => {
        if (!userId) return;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch Guide Info
                const guideRes = await api.get(`/api/guides/${userId}/`);
                setGuide(guideRes.data);

                // 2. Fetch Accommodations (Try multiple endpoints)
                let accs = [];
                const tryEndpoints = [
                    `/api/guides/${userId}/accommodations/`,
                    `/api/accommodations/?guide=${userId}`,
                    `/api/accommodations/?owner=${userId}`,
                    `/api/accommodations/`
                ];

                for (const ep of tryEndpoints) {
                    try {
                        const r = await api.get(ep);
                        if (Array.isArray(r.data)) {
                            accs = r.data;
                        } else if (Array.isArray(r.data.results)) {
                            accs = r.data.results;
                        } else if (r.data && typeof r.data === 'object') {
                            if (Array.isArray(r.data.results)) accs = r.data.results;
                            else if (Array.isArray(r.data.data)) accs = r.data.data;
                            else accs = [r.data];
                        }
                        if (accs.length > 0) break;
                    } catch (e) { /* continue */ }
                }
                setAccommodations(accs || []);

                // 3. Fetch Tours
                let foundTours = [];
                const tourEndpoints = [
                    `/api/guides/${userId}/tours/`,
                    `/api/tours/?guide=${userId}`,
                    `/api/tours/`
                ];

                for (const ep of tourEndpoints) {
                    try {
                        const r = await api.get(ep);
                        if (Array.isArray(r.data)) foundTours = r.data;
                        else if (Array.isArray(r.data.results)) foundTours = r.data.results;
                        if (foundTours.length > 0) break;
                    } catch (e) { /* continue */ }
                }
                setTours(foundTours || []);

            } catch (err) {
                console.warn('ViewAccommodations load error', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Header */}
                <View style={styles.headerRow}>
                    <Ionicons name="arrow-back" size={24} onPress={() => router.back()} color="#1A2332" />
                    <Text style={styles.title}>Accommodations & Tours</Text>
                </View>

                {error && (
                    <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
                )}

                {/* Guide Profile Card */}
                {guide && (
                    <View style={styles.guideCard}>
                        <View style={styles.iconWrapper}>
                            {guide.profile_picture ? (
                                <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePicture} />
                            ) : (
                                <Ionicons name="person" size={30} color="#fff" />
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                            <Text style={styles.guideSub}>{guide.location || "Local Guide"}</Text>
                        </View>
                    </View>
                )}

                {/* --- ACCOMMODATIONS LIST (Vertical: 1 then 2) --- */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="bed" size={18} color="#1A2332" />
                    <Text style={styles.sectionTitle}>Accommodations ({accommodations.length})</Text>
                </View>
                
                {accommodations.length === 0 && <Text style={styles.empty}>No accommodations listed.</Text>}

                {accommodations.map((acc, index) => {
                    // Robust image finder
                    const img = acc.photo || acc.image || acc.images?.[0]?.image || acc.photos?.[0]?.url;
                    const amenities = acc.amenities || acc.features || acc.meta || {};

                    return (
                        <View key={acc.id || index} style={styles.verticalCard}>
                            {/* Image Section */}
                            <View style={styles.imageContainer}>
                                {img ? (
                                    <Image source={{ uri: getImageUrl(img) }} style={styles.cardImage} />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Ionicons name="image-outline" size={40} color="#ccc" />
                                    </View>
                                )}
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>₱{acc.price ?? acc.rate ?? 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Details Section */}
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{acc.title || acc.name || 'Untitled Accommodation'}</Text>
                                
                                {acc.location && (
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-sharp" size={12} color="#888" />
                                        <Text style={styles.locationText} numberOfLines={1}>{acc.location}</Text>
                                    </View>
                                )}

                                {acc.description && (
                                    <Text style={styles.cardDesc} numberOfLines={2}>{acc.description}</Text>
                                )}

                                {/* Amenities Row */}
                                <View style={styles.amenitiesRow}>
                                    {((amenities && amenities.wifi) || acc.wifi) && (
                                        <View style={styles.amenityTag}><Ionicons name="wifi" size={12} color="#666" /><Text style={styles.amenityText}>Wifi</Text></View>
                                    )}
                                    {((amenities && amenities.parking) || acc.parking) && (
                                        <View style={styles.amenityTag}><Ionicons name="car" size={12} color="#666" /><Text style={styles.amenityText}>Parking</Text></View>
                                    )}
                                    {((amenities && amenities.breakfast) || acc.breakfast) && (
                                        <View style={styles.amenityTag}><Ionicons name="cafe" size={12} color="#666" /><Text style={styles.amenityText}>Breakfast</Text></View>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* --- TOURS LIST --- */}
                <View style={[styles.sectionHeader, {marginTop: 20}]}>
                    <Ionicons name="map" size={18} color="#1A2332" />
                    <Text style={styles.sectionTitle}>Tours Packages ({tours.length})</Text>
                </View>

                {tours.length === 0 && <Text style={styles.empty}>No tours listed.</Text>}

                {tours.map((t, index) => (
                    <View key={t.id || index} style={styles.verticalCard}>
                        <View style={styles.cardContent}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={styles.cardTitle}>{t.title || t.name || 'Untitled Tour'}</Text>
                                <Text style={{color: '#00A8FF', fontWeight: '700'}}>₱{t.price}</Text>
                            </View>
                            
                            {t.duration && <Text style={styles.locationText}>Duration: {t.duration}</Text>}
                            {t.description && <Text style={styles.cardDesc} numberOfLines={2}>{t.description}</Text>}

                            {/* Tour Stops Preview */}
                            {t.stops && t.stops.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
                                    {t.stops.map((stop, i) => (
                                        <View key={i} style={{marginRight: 8}}>
                                            <Image source={{uri: getImageUrl(stop.image)}} style={{width: 80, height: 60, borderRadius: 6}} />
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 20, fontWeight: '700', marginLeft: 12, color: '#1A2332' },
    
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    
    // Guide Card
    guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E0E6ED' },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    profilePicture: { width: '100%', height: '100%' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideSub: { fontSize: 13, color: '#666' },

    // Vertical Card Style (Accommodations & Tours)
    verticalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    imageContainer: { height: 180, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    
    priceBadge: {
        position: 'absolute', bottom: 10, right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
    },
    priceText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    cardContent: { padding: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    locationText: { fontSize: 12, color: '#888', marginLeft: 4 },
    
    cardDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },

    amenitiesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    amenityTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
    amenityText: { fontSize: 11, color: '#666' },

    empty: { color: '#888', fontSize: 13, fontStyle: 'italic', marginBottom: 10, marginLeft: 4 },
    errorBox: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 12 },
    errorText: { color: '#b91c1c' }
});