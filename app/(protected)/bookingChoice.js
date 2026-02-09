import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BookingChoice = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { placeId, placeName } = params;
    const [selectedOption, setSelectedOption] = useState(null);

    const handleCustomGuide = () => {
        router.push({
            pathname: '/(protected)/guideSelection',
            params: { 
                placeId: placeId,
                placeName: placeName 
            }
        });
    };

    const handleAgencyBooking = () => {
        router.push({
            pathname: '/(protected)/agencySelection',
            params: { placeId, placeName }
        });
    };

    const OptionCard = ({ 
        icon, 
        title, 
        description, 
        features, 
        isSelected, 
        accentColor,
        gradient,
        buttonText,
        onButtonPress 
    }) => (
        <TouchableOpacity
            onPress={() => setSelectedOption(title)}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={isSelected ? gradient : ['#ffffff', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.card,
                    isSelected && [styles.cardSelected, { shadowOpacity: 0.2 }]
                ]}
            >
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                <View style={styles.topSection}>
                    <LinearGradient
                        colors={[accentColor + '20', accentColor + '08']}
                        style={styles.iconBox}
                    >
                        <Text style={styles.icon}>{icon}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{title}</Text>
                        <Text style={styles.cardDescription}>{description}</Text>
                    </View>
                </View>

                <View style={styles.featuresList}>
                    {features.map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                            <View style={[styles.featureCheck, { borderColor: accentColor }]}>
                                <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
                            </View>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <LinearGradient
                    colors={[accentColor, accentColor + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        onPress={onButtonPress}
                        activeOpacity={0.8}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>
                            {isSelected ? '✓ Selected' : buttonText}
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.fullContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <ScrollView 
                style={styles.container} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    
                    {/* --- ADDED BACK BUTTON --- */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>CHOOSE BOOKING TYPE</Text>
                </View>

                <View style={styles.headerSection}>
                    <Text style={styles.mainHeader}>Select Your Experience</Text>
                    <Text style={styles.placeName}>{placeName || 'This Location'}</Text>
                    <Text style={styles.subtext}>Choose how you'd like to explore</Text>
                </View>

                <View style={styles.cardsContainer}>
                    <OptionCard
                        icon="👤"
                        title="Custom Local Guide"
                        description="One-on-one personalized journey"
                        features={[
                            'Direct contact with your guide',
                            'Fully flexible itinerary',
                            'Authentic local stories',
                            'Customized to your pace'
                        ]}
                        isSelected={selectedOption === 'Custom Local Guide'}
                        accentColor="#0066ff"
                        gradient={['#e8f1ff', '#f5f9ff']}
                        buttonText="Choose This"
                        onButtonPress={handleCustomGuide}
                    />

                    <OptionCard
                        icon="🏢"
                        title="Professional Agency"
                        description="Curated tours by verified agencies"
                        features={[
                            'Verified & reviewed agencies',
                            'Professional guide assignment',
                            'Group-friendly options',
                            'Structured & organized tours'
                        ]}
                        isSelected={selectedOption === 'Professional Agency'}
                        accentColor="#00c853"
                        gradient={['#e8f5e9', '#f1f8f5']}
                        buttonText="Choose This"
                        onButtonPress={handleAgencyBooking}
                    />
                </View>

                <View style={styles.comparisonBox}>
                    <View style={styles.comparisonRow}>
                        <View style={styles.comparisonItem}>
                            <Text style={styles.compLabel}>Best For</Text>
                            <Text style={[styles.compValue, { color: '#0066ff' }]}>Solo/Couples</Text>
                            <Text style={[styles.compValue, { color: '#00c853' }]}>Groups</Text>
                        </View>
                        <View style={styles.comparisonItem}>
                            <Text style={styles.compLabel}>Price</Text>
                            <Text style={[styles.compValue, { color: '#0066ff' }]}>Flexible</Text>
                            <Text style={[styles.compValue, { color: '#00c853' }]}>Standard</Text>
                        </View>
                        <View style={styles.comparisonItem}>
                            <Text style={styles.compLabel}>Flexibility</Text>
                            <Text style={[styles.compValue, { color: '#0066ff' }]}>Maximum</Text>
                            <Text style={[styles.compValue, { color: '#00c853' }]}>Planned</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.trustBadge}>
                    <Text style={styles.trustIcon}>⭐</Text>
                    <Text style={styles.trustText}>Trusted by 10K+ travelers</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        marginBottom: 20,
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
    // --- ADDED BACK BUTTON STYLE ---
    backButton: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        padding: 5, 
        zIndex: 10 
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
    container: { flex: 1 },
    headerSection: {
        marginBottom: 36,
        alignItems: 'center',
    },
    mainHeader: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    placeName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0066ff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtext: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
        textAlign: 'center',
    },
    cardsContainer: {
        width: '100%',
        marginBottom: 28,
        paddingHorizontal: 20
    },
    card: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 0,
        marginBottom: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
    },
    cardSelected: { elevation: 10 },
    accentBar: {
        height: 4,
        marginHorizontal: -20,
        marginBottom: 16,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 18,
        marginTop: 20,
        gap: 16,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: { fontSize: 32 },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        color: '#777',
        fontWeight: '500',
        lineHeight: 18,
    },
    featuresList: { marginBottom: 20 },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    featureCheck: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 14,
        fontWeight: '800',
    },
    featureText: {
        fontSize: 13,
        color: '#555',
        flex: 1,
    },
    buttonContainer: {
        marginHorizontal: -20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    button: { paddingVertical: 14, alignItems: 'center' },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '800',
    },
    comparisonBox: {
        backgroundColor: '#f8fafb',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e8ecf1',
        marginBottom: 20,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    comparisonItem: { alignItems: 'center', flex: 1 },
    compLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#999',
        marginBottom: 12,
    },
    compValue: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    trustBadge: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 20,
    },
    trustIcon: { fontSize: 24, marginBottom: 8 },
    trustText: {
        fontSize: 13,
        color: '#999',
        fontWeight: '500',
    },
});

export default BookingChoice;