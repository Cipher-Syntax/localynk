import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import Swiper from 'react-native-swiper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const TouristGuideDetails = () => {
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const params = useLocalSearchParams();
    const { guideId, placeId, placeName } = params;

    useEffect(() => {
        console.log('Fetching guide with ID:', guideId);
        const fetchGuide = async () => {
            try {
                const response = await api.get(`/api/guides/${guideId}/`);
                setGuide(response.data);
            } catch (error) {
                console.error('Failed to fetch guide details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (guideId) {
            fetchGuide();
        }
    }, [guideId]);

    if (loading || !guide) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    <Text style={styles.headerTitle}>GUIDE DETAILS</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.guideCard}>
                        
                        {/* Profile Header */}
                        <View style={styles.cardProfileSection}>
                            <View style={styles.iconWrapper}>
                                <User size={40} color="#fff" />
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                                <Text style={styles.guideAddress}>{guide.location}</Text>
                                <Text style={styles.guideRating}>
                                    {guide.guide_rating} <Ionicons name="star" color="#C99700" />
                                </Text>
                            </View>
                            <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.viewProfileButton} onPress={() => router.push({ pathname: "/(protected)/home/profile", params: { userId: guide.id } })}>
                                <Ionicons name="person" size={14} color="#fff" />
                                <Text style={styles.viewProfileText}>View Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sendMessageButton} onPress={() => router.push({ pathname: "/(protected)/message" })}>
                                <Ionicons name="chatbubble" size={14} color="#fff" />
                                <Text style={styles.sendMessageText}>Send Message</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Pricing Section */}
                        <View style={styles.pricingContainer}>
                            <Text style={styles.priceText}>Price: ₱{guide.price_per_day}/day</Text>
                            <Text style={styles.priceNote}>
                                Solo: ₱{guide.solo_price_per_day}/day{'\n'}
                                Multiple: Additional ₱{guide.multiple_additional_fee_per_head} per head/day
                            </Text>
                        </View>

                        {/* Guide Details Section */}
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsHeader}>Guide Details</Text>

                            <View style={styles.infoItem}>
                                <Ionicons name="language" size={16} color="#1A2332" />
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Language: </Text>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="compass" size={16} color="#1A2332" />
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Specialty: </Text>{guide.specialty}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="time" size={16} color="#1A2332" />
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Experience: </Text>{guide.experience_years} years</Text>
                            </View>

                            <Text style={styles.noteText}>
                                Price includes guiding services, local assistance, and safety gear. Accommodation and meals not included.
                            </Text>
                        </View>
                        
                        {/* Book Button - Direct to Payment/Date Selection */}
                        <TouchableOpacity 
                            style={styles.bookButton} 
                            activeOpacity={0.8} 
                            onPress={() => router.push({ 
                                pathname: "/(protected)/payment",
                                // 3. Pass ALL necessary info to Payment
                                params: { 
                                    guideId: guide.id,
                                    guideName: `${guide.first_name} ${guide.last_name}`,
                                    basePrice: guide.price_per_day, 
                                    placeId: placeId,
                                    placeName: placeName
                                } 
                            })}
                        >
                            <Text style={styles.bookButtonText}>BOOK NOW</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    contentContainer: {
        padding: 16,
    },
    guideCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    cardProfileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1A2332',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    guideName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332',
    },
    guideAddress: {
        fontSize: 12,
        color: '#8B98A8',
        marginTop: 4,
    },
    guideRating: {
        fontSize: 12,
        color: '#C99700',
        marginTop: 2,
    },
    
    // Availability Badge Styles
    availabilityContainer: { flexDirection: 'row', gap: 4, marginTop: 4 },
    dayBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    dayAvailable: { backgroundColor: '#28A745' }, // Green
    dayUnavailable: { backgroundColor: '#E0E0E0' }, // Gray
    dayText: { fontSize: 9, fontWeight: '700' },
    dayTextAvailable: { color: '#fff' },
    dayTextUnavailable: { color: '#A0A0A0' },

    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    viewProfileButton: {
        flex: 1,
        backgroundColor: '#00A8FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    viewProfileText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sendMessageButton: {
        flex: 1,
        backgroundColor: '#00A8FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    sendMessageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    featuredSection: {
        marginBottom: 20,
    },
    featuredTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 4,
    },
    featuredDescription: {
        fontSize: 11,
        color: '#8B98A8',
        marginBottom: 8,
    },
    featureList: {
        paddingBottom: 10,
    },
    featureCard: {
        width: 160,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 10,
        position: 'relative',
    },
    featureImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    featureOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    featureBottom: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginRight: 5,
    },
    accommodationContainer: {
        height: 300,
        overflow: 'hidden',
        marginBottom: 20,
    },
    swiper: {
        height: "100%",
        borderRadius: 20,
    },
    accommodationImage: {
        width: width - 32, // Adjusting for padding
        height: "100%",
        borderRadius: 15,
    },
    swiperButton: {
        fontSize: 50,
        color: '#fff',
        fontWeight: 'bold',
    },
    pricingContainer: {
        marginTop: 10,
    },
    priceText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
        paddingBottom: 4,
        color: '#1A2332',
    },
    priceNote: {
        fontSize: 12,
        color: '#000',
        marginTop: 2,
        lineHeight: 16,
    },
    detailsSection: {
        marginTop: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E6ED',
    },
    detailsHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 6,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#1A2332',
        marginLeft: 6,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#1A2332',
    },
    noteText: {
        fontSize: 11,
        color: '#8B98A8',
        marginTop: 8,
        lineHeight: 16,
    },
    bookButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20,
        shadowColor: "#00A8FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default TouristGuideDetails;