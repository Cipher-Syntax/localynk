import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const AttractionDetails = () => {
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff"
            }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    const router = useRouter();
    
    const guideCards = [
        {
            name: "John Dela Cruz",
            address: "Baliwasan",
            rating: 4.5,
            language: "English, Tagalog",
            specialty: "Mountain Guiding",
            experience: "8 years",
            price: "₱1,500/day",
        },
        {
            name: "Maria Santos",
            address: "Bunguiao",
            rating: 4.0,
            language: "English, Cebuano",
            specialty: "Island Hopping",
            experience: "5 years",
            price: "₱1,200/day",
        },
        {
            name: "Carlos Mendoza",
            address: "Mercedes",
            rating: 5.0,
            language: "English, Spanish, Tagalog",
            specialty: "Historical Tours",
            experience: "10 years",
            price: "₱1,800/day",
        },
        {
            name: "Liza Cruz",
            address: "Zambowood",
            rating: 3.5,
            language: "English, Tagalog",
            specialty: "Rainforest & Nature Walks",
            experience: "6 years",
            price: "₱1,400/day",
        },
        {
            name: "Ramon Villanueva",
            address: "Patalon",
            rating: 4.5,
            language: "English, Tagalog",
            specialty: "Wildlife & Landscape Tours",
            experience: "7 years",
            price: "₱1,600/day",
        },
    ];


    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                
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
                    {guideCards.map((guide, index) => (
                        <View key={index} style={styles.guideCard}>
                            <View style={styles.cardProfileSection}>
                                <View style={styles.iconWrapper}>
                                    <User size={40} color="#8B98A8" />
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.guideName}>{guide.name}</Text>
                                    <Text style={styles.guideAddress}>{guide.address}</Text>
                                    <Text style={styles.guideRating}>{
                                        guide.rating} <Ionicons name="star" color="#C99700" />
                                    </Text>
                                </View>
                                <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
                            </View>

                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Language</Text>
                                    <Text style={styles.detailValue}>{guide.language}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Specialty</Text>
                                    <Text style={styles.detailValue}>{guide.specialty}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Years of Experience</Text>
                                    <Text style={styles.detailValue}>{guide.experience}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Price of Package</Text>
                                    <Text style={styles.detailValue}>{guide.price}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.8} onPress={() => router.push({pathname: "/(protected)/touristGuideDetails",})}>
                                <Text style={styles.bookButton}>BOOK NOW</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

export default AttractionDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#D9E2E9',
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
        gap: 12,
    },
    guideCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 15
    },
    cardProfileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EBF0F5',
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
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    detailItem: {
        width: '48%',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#EBF0F5',
        borderRadius: 8,
    },
    detailLabel: {
        fontSize: 11,
        color: '#8B98A8',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '600',
        marginTop: 4,
    },
    buttonContainer: {
        alignItems: 'center',
    },
    bookButton: {
        backgroundColor: '#00A8FF',
        color: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: '700',
        overflow: 'hidden',
        textAlign: 'center',
        width: '100%',
    },
});
