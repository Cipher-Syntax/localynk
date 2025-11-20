import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; // 1. Ensure useLocalSearchParams is imported
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const AttractionDetails = () => {
    const { placeId, placeName } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [guides, setGuides] = useState([]);
    
    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const response = await api.get('/api/guides/');
                setGuides(response.data);
            } catch (error) {
                console.error('Failed to fetch guides:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGuides();
    }, []);

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

    const handleChooseGuide = (guide) => {
        // 3. Pass BOTH the Guide Info AND the Destination Info to the next screen
        router.push({
            pathname: "/(protected)/guideAvailability",
            params: { 
                // Guide Details
                guideId: guide.id, 
                guideName: `${guide.first_name} ${guide.last_name}`,
                itinerary: guide.tour_itinerary,
                availableDays: JSON.stringify(guide.available_days),
                price: guide.price_per_day, // Good to pass price too

                // Destination Details (Keep passing them forward!)
                placeId: placeId,
                placeName: placeName
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
                <Text style={styles.headerTitle}>EXPLORE PERFECT GUIDE FOR YOU</Text>
            </View>

            <View style={styles.contentContainer}>
                {guides.map((guide, index) => (
                    <View key={index} style={styles.guideCard}>
                        <View style={styles.cardProfileSection}>
                            <View style={styles.iconWrapper}>
                                <User size={40} color="#8B98A8" />
                            </View>
                            
                            <View style={styles.profileInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                                    {renderAvailability(guide.available_days)}
                                </View>
                                
                                <Text style={styles.guideAddress}>{guide.location}</Text>
                                <Text style={styles.guideRating}>
                                    {guide.guide_rating} <Ionicons name="star" size={12} color="#C99700" />
                                </Text>
                            </View>

                            <TouchableOpacity>
                                <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Language</Text>
                                <Text style={styles.detailValue}>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Specialty</Text>
                                <Text style={styles.detailValue}>{guide.specialty}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Experience</Text>
                                <Text style={styles.detailValue}>{guide.experience_years} years</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Price</Text>
                                <Text style={styles.detailValue}>₱{guide.price_per_day}/day</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.buttonContainer} 
                            activeOpacity={0.8} 
                            onPress={() => handleChooseGuide(guide)}
                        >
                            <Text style={styles.bookButton}>CHOOSE THIS GUIDE</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default AttractionDetails;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700' },
    contentContainer: { padding: 16, gap: 12 },
    
    guideCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 10 },
    
    cardProfileSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center' },
    profileInfo: { flex: 1, marginLeft: 12 },
    
    nameRow: { flexDirection: 'column', alignItems: 'flex-start' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideAddress: { fontSize: 12, color: '#8B98A8' },
    guideRating: { fontSize: 12, color: '#C99700', marginTop: 2 },
    
    // Availability Badge Styles
    availabilityContainer: { flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 4 },
    dayBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    dayAvailable: { backgroundColor: '#28A745' }, // Green
    dayUnavailable: { backgroundColor: '#E0E0E0' }, // Gray
    dayText: { fontSize: 9, fontWeight: '700' },
    dayTextAvailable: { color: '#fff' },
    dayTextUnavailable: { color: '#A0A0A0' },

    // Details Grid
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    detailItem: { width: '48%', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    detailLabel: { fontSize: 11, color: '#8B98A8' },
    detailValue: { fontSize: 13, color: '#1A2332', fontWeight: '600', marginTop: 4 },
    
    buttonContainer: { alignItems: 'center' },
    bookButton: { backgroundColor: '#00C6FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', width: '100%', overflow: 'hidden' },
});