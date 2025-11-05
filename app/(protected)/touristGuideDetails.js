import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Swiper from 'react-native-swiper';

import FeaturePlace4 from '../../assets/localynk_images/featured4.png';
import FeaturePlace5 from '../../assets/localynk_images/featured5.png';
import FeaturePlace6 from '../../assets/localynk_images/featured6.png';
import House1 from '../../assets/localynk_images/login_background.png';
import House2 from '../../assets/localynk_images/register_background.png';
import House3 from '../../assets/localynk_images/featured1.png';

const { width } = Dimensions.get('window');

const TouristGuideDetails = () => {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const guide = {
        name: "John Dela Cruz",
        address: "Baliwasan",
        rating: 4.5,
        language: "English, Tagalog",
        specialty: "Mountain Guiding",
        experience: "8 years",
        price: "₱1,500/day",
        featuredPlaces: [
            { id: 1, image: FeaturePlace4 },
            { id: 2, image: FeaturePlace5 },
            { id: 3, image: FeaturePlace6 },
        ],
        accommodationImages: [House1, House2, House3],
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                <Text style={styles.headerTitle}>EXPLORE PERFECT GUIDE FOR YOU</Text>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.guideCard}>
                    <View style={styles.cardProfileSection}>
                        <View style={styles.iconWrapper}>
                            <User size={40} color="#fff" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.guideName}>{guide.name}</Text>
                            <Text style={styles.guideAddress}>{guide.address}</Text>
                            <Text style={styles.guideRating}>
                                {guide.rating} <Ionicons name="star" color="#C99700" />
                            </Text>
                        </View>
                        <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.viewProfileButton}>
                            <Ionicons name="person" size={14} color="#fff" />
                            <Text style={styles.viewProfileText}>View Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sendMessageButton} onPress={() => router.push({ pathname: "/(protected)/message" })}>
                            <Ionicons name="chatbubble" size={14} color="#fff" />
                            <Text style={styles.sendMessageText}>Send Message</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.featuredSection}>
                        <Text style={styles.featuredTitle}>FEATURED PLACES</Text>
                        <Text style={styles.featuredDescription}>
                            Handpicked by locals. Loved by travelers. Discover your next stop!
                        </Text>

                        <FlatList
                            horizontal
                            data={guide.featuredPlaces}
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featureList}
                            renderItem={({ item }) => (
                                <View style={styles.featureCard}>
                                    <Image source={item.image} style={styles.featureImage} />
                                    <View style={styles.featureOverlay} />
                                    <View style={styles.featureBottom}>
                                        <Text style={styles.featureText}>Discover More</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                                    </View>
                                </View>
                            )}
                        />
                    </View>

                    <View style={styles.accommodationContainer}>
                        <Text style={styles.featuredTitle}>ACCOMMODATION</Text>
                        <Swiper
                            style={styles.swiper}
                            autoplay
                            loop
                            showsPagination
                            autoplayTimeout={5}
                            showsButtons={true}
                        >
                            {guide.accommodationImages.map((image, index) => (
                                <Image
                                    key={index}
                                    source={image}
                                    style={styles.accommodationImage}
                                    resizeMode="cover"
                                />
                            ))}
                        </Swiper>
                    </View>

                    <View style={styles.pricingContainer}>
                        <Text style={styles.priceText}>Price: {guide.price}</Text>
                    </View>

                    <View style={styles.detailsSection}>
                        <Text style={styles.detailsHeader}>Guide Details</Text>

                        <View style={styles.infoItem}>
                            <Ionicons name="language" size={16} color="#1A2332" />
                            <Text style={styles.detailText}><Text style={styles.detailLabel}>Language: </Text>{guide.language}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Ionicons name="compass" size={16} color="#1A2332" />
                            <Text style={styles.detailText}><Text style={styles.detailLabel}>Specialty: </Text>{guide.specialty}</Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={16} color="#1A2332" />
                            <Text style={styles.detailText}><Text style={styles.detailLabel}>Experience: </Text>{guide.experience}</Text>
                        </View>

                        <Text style={styles.noteText}>
                            Price includes guiding services, local assistance, and safety gear. Accommodation and meals not included.
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.bookButton} activeOpacity={0.8} onPress={() => router.push({ pathname: "/(protected)/payment" })}>
                        <Text style={styles.bookButtonText}>BOOK NOW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default TouristGuideDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D9E2E9',
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
        borderBottomRightRadius: 25,
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
        marginTop: 2,
    },
    guideRating: {
        fontSize: 12,
        color: '#C99700',
        marginTop: 2,
    },
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
        width: width - 32,
        height: "100%",
    },
    pricingContainer: {
        marginTop: 20,
    },
    priceText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
        paddingBottom: 4,
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
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 30,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
