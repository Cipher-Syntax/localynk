import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, ArrowRight } from "lucide-react-native";
import api from '../../api/api';

const GuideDestinations = () => {
    const { guideId, guideName } = useLocalSearchParams();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [destinations, setDestinations] = useState([]);

    useEffect(() => {
        const fetchDestinations = async () => {
            if (!guideId) return;
            try {
                // Fetch UNIQUE destinations for this guide
                const response = await api.get(`/api/guides/${guideId}/destinations/`);
                setDestinations(response.data || []);
            } catch (error) {
                console.error('Failed to fetch guide destinations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDestinations();
    }, [guideId]);

    const getImageUrl = (img) => {
        if (!img) return null;
        if (typeof img === 'string' && img.startsWith('http')) return img;
        // Check if img is an object (common in some serializer setups) or string
        const path = typeof img === 'object' ? img.image : img;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${path}`;
    };

    const handleSelectDestination = (destination) => {
        // Navigate to Guide Availability using the Destination ID (placeId)
        // The availability screen will look up the specific tour for this guide + destination
        router.push({
            pathname: "/(protected)/guideAvailability",
            params: { 
                guideId: guideId, 
                guideName: guideName,
                placeId: destination.id, 
                placeName: destination.name,
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <StatusBar barStyle="light-content" />
                
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

                    <Text style={styles.headerTitle}>AVAILABLE DESTINATIONS</Text>
                    <Text style={styles.headerSubtitle}>covered by {guideName}</Text>
                </View>

                {destinations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No active destinations found for this guide.</Text>
                    </View>
                ) : (
                    <View style={styles.contentContainer}>
                        <Text style={styles.sectionLabel}>Select a Place to Visit</Text>
                        
                        {destinations.map((dest, index) => {
                            // Handle image extraction based on potential list or single object
                            const displayImage = dest.images && dest.images.length > 0 
                                ? getImageUrl(dest.images[0]) 
                                : null;

                            return (
                                <TouchableOpacity 
                                    key={dest.id || index} 
                                    style={styles.destinationCard}
                                    activeOpacity={0.9}
                                    onPress={() => handleSelectDestination(dest)}
                                >
                                    <View style={styles.imageContainer}>
                                        {displayImage ? (
                                            <Image source={{ uri: displayImage }} style={styles.cardImage} />
                                        ) : (
                                            <View style={[styles.cardImage, { backgroundColor: '#ddd' }]} />
                                        )}
                                        <LinearGradient 
                                            colors={['transparent', 'rgba(0,0,0,0.7)']} 
                                            style={styles.cardGradient} 
                                        />
                                        <View style={styles.cardTextOverlay}>
                                            <Text style={styles.destinationName}>{dest.name}</Text>
                                            <View style={styles.locationRow}>
                                                <MapPin size={12} color="#fff" />
                                                <Text style={styles.locationText}>{dest.location}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.categoryBadge}>{dest.category || 'Destination'}</Text>
                                        <View style={styles.arrowBtn}>
                                            <Text style={styles.selectText}>View Plan</Text>
                                            <ArrowRight size={16} color="#00A8FF" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default GuideDestinations;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    
    header: { height: 140, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 35, left: 20, color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSubtitle: { position: 'absolute', bottom: 15, left: 20, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
    
    backButton: { position: 'absolute', top: 20, left: 20, padding: 5, zIndex: 10 },

    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: '#8B98A8', textAlign: 'center' },

    contentContainer: { padding: 20 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },

    destinationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    imageContainer: { height: 160, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
    cardTextOverlay: { position: 'absolute', bottom: 12, left: 16, right: 16 },
    
    destinationName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 3 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff' },
    categoryBadge: { fontSize: 12, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '600' },
    
    arrowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    selectText: { fontSize: 13, color: '#00A8FF', fontWeight: '700' }
});