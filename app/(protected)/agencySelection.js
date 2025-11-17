import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Random image URLs
const AGENCY_IMAGES = [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1488386341026-7e89a88adc34?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=250&fit=crop',
    'https://images.unsplash.com/photo-1504681869696-d977211a0e38?w=400&h=250&fit=crop',
];

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    // IMPORTANT — includes placeImage now
    const { placeName, placeImage } = params;

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedAgencyName, setSelectedAgencyName] = useState('');

    const mockAgencies = [
        {
            id: 1,
            name: 'Sunshine Tours',
            rating: 4.5,
            reviews: 342,
            description: 'Reliable and friendly tour agency specializing in outdoor adventures.',
            specialties: ['Nature', 'Culture', 'Beach'],
            price: '₱ 1,200/person',
            image: AGENCY_IMAGES[0],
            established: '2015',
        },
        {
            id: 2,
            name: 'Adventure Seekers',
            rating: 4.8,
            reviews: 518,
            description: 'For thrill-seekers and adventure lovers seeking unforgettable experiences.',
            specialties: ['Hiking', 'Rafting', 'Extreme Sports'],
            price: '₱ 1,500/person',
            image: AGENCY_IMAGES[1],
            established: '2016',
        },
        {
            id: 3,
            name: 'City Explorers',
            rating: 4.2,
            reviews: 267,
            description: 'Explore cities and urban landmarks with our knowledgeable guides.',
            specialties: ['Urban', 'Historical', 'Food'],
            price: '₱ 900/person',
            image: AGENCY_IMAGES[2],
            established: '2017',
        },
        {
            id: 4,
            name: 'Wanderlust Journeys',
            rating: 4.9,
            reviews: 621,
            description: 'Premium travel experiences crafted for discerning travelers worldwide.',
            specialties: ['Luxury', 'Cultural', 'Photography'],
            price: '₱ 2,000/person',
            image: AGENCY_IMAGES[3],
            established: '2014',
        },
        {
            id: 5,
            name: 'Local Guides Co.',
            rating: 4.6,
            reviews: 453,
            description: 'Authentic local experiences with guides who know every hidden gem.',
            specialties: ['Local', 'Authentic', 'Off-beat'],
            price: '₱ 800/person',
            image: AGENCY_IMAGES[4],
            established: '2018',
        },
        {
            id: 6,
            name: 'Express Tours',
            rating: 4.3,
            reviews: 289,
            description: 'Fast-paced tours for travelers who want to see it all in one day.',
            specialties: ['Quick Tours', 'Popular Sites', 'Budget'],
            price: '₱ 700/person',
            image: AGENCY_IMAGES[5],
            established: '2019',
        },
    ];

    useEffect(() => {
        setTimeout(() => {
            setAgencies(mockAgencies);
            setLoading(false);
        }, 1200);
    }, []);

    const handleSelectAgency = (agencyId, agencyName) => {
        setSelectedAgencyName(agencyName);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        router.replace('/(protected)/home/');
    };

    const renderAgencyCard = ({ item }) => (
        <View style={styles.agencyCard}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.agencyImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageOverlay}
                />
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewsText}>({item.reviews})</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.agencyName}>{item.name}</Text>
                <Text style={styles.agencyDesc}>{item.description}</Text>

                <View style={styles.specialtiesContainer}>
                    {item.specialties.map((sp, idx) => (
                        <View key={idx} style={styles.specialtyTag}>
                            <Text style={styles.specialtyText}>{sp}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.established}>Est. {item.established}</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Starting from</Text>
                    <Text style={styles.priceValue}>{item.price}</Text>
                </View>

                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => handleSelectAgency(item.id, item.name)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.selectButtonText}>Select Agency</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
                <Text style={styles.loadingText}>Fetching agencies...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* 🟦 FIXED HEADER USING EXISTING PLACE IMAGE */}
                    <View>
						<View style={styles.header}>
							<Image
								source={require('../../assets/localynk_images/header.png')}
								style={styles.headerImage}
							/>
							<LinearGradient
								colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
								style={styles.overlay}
							/>
							<Text style={styles.headerTitle}>CHOOSE YOUR PREFFERED AGENCY</Text>
						</View>
					</View>

                    <View style={styles.listContainer}>
                        <FlatList
                            data={agencies}
                            renderItem={renderAgencyCard}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                        />
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* MODAL */}
            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>

                        <Ionicons
                            name="hourglass-outline"
                            size={80}
                            color="#F5A623"
                            style={{ marginBottom: 10 }}
                        />

                        <Text style={styles.modalHeader}>REQUEST SENT</Text>
                        <Text style={styles.modalTitle}>Booking Sent!</Text>
                        <Text style={styles.modalAgency}>{selectedAgencyName}</Text>

                        <Text style={styles.modalMessage}>
                            Your booking request has been sent to {selectedAgencyName}.  
                            They will respond within 1–3 business days.
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleModalClose}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </View>
    );
};

/* ===========================================================
                     STYLES
=========================================================== */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },

    /* HEADER FIXED */
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
    // headerSubtitle: {
    //     color: '#f1f1f1',
    //     fontSize: 14,
    // },

    /* LOADING */
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#555' },

    /* LIST */
    listContainer: { paddingHorizontal: 16 },

    agencyCard: {
		marginTop: 30,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 18,
        elevation: 5,
    },

    imageContainer: {
        position: 'relative',
        height: 200,
        overflow: 'hidden',
    },
    agencyImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },

    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    reviewsText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

    cardContent: { padding: 16 },
    agencyName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 6,
    },
    agencyDesc: {
        color: '#666',
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 18,
    },

    specialtiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    specialtyTag: { backgroundColor: '#E8F4FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    specialtyText: { color: '#00A8FF', fontSize: 11, fontWeight: '600' },

    established: { color: '#666', marginBottom: 12, fontSize: 12 },

    priceContainer: {
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#00A8FF',
        marginBottom: 14,
    },
    priceLabel: { fontSize: 11, color: '#666' },
    priceValue: { fontSize: 18, fontWeight: '800', color: '#00A8FF' },

    selectButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    selectButtonText: { color: '#fff', fontWeight: '800' },

    /* MODAL */
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 25,
        alignItems: 'center',
    },
    modalHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F5A623',
        marginBottom: 8,
        letterSpacing: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
    },
    modalAgency: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00A8FF',
        marginBottom: 12,
    },
    modalMessage: {
        textAlign: 'center',
        color: '#555',
        lineHeight: 18,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default AgencySelection;
