import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, StatusBar, FlatList, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';


const FeaturedPlacesDetails = () => {
    const [loading, setLoading] = useState(true);
    
    
    const router = useRouter();
    const params = useLocalSearchParams();
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
    };
    
    useEffect(() => {
        startBounce();
    }, []);
    
    const getDestinationImage = () => {
        if (params.image) {
            return { uri: params.image };
        }
        // return FeaturePlace1;
    };
    
    const destinationImage = getDestinationImage();
    
    
    const destinationInfo = {
        title: 'BAGACAY FALLS',
        description:
        "Tucked away in the greenery of Zamboanga City, Bagacay Falls offers a refreshing escape with its clear waters and calm, natural pool. Surrounded by rocks and trees, it’s a peaceful spot for swimming, relaxing, or simply enjoying nature’s quiet charm.",
        image: destinationImage,
    };
    
    const featuredImages = [
        { id: 1, image: destinationImage, title: 'Selected Destination' },
        { id: 2, image: destinationImage, title: 'Mountain Peak' },
        { id: 3, image: destinationImage, title: 'Urban Escape' },
        { id: 4, image: destinationImage, title: 'Hidden Gem' },
    ];
    

    const guideCards = [
        {
            id: 1,
            name: "John Dela Cruz",
            address: "Baliwasan",
            rating: 4.5,
            language: "English, Tagalog",
            specialty: "Mountain Guiding",
            experience: "8 years",
            price: "₱1,500/day",
        },
        {
            id: 2,
            name: "Maria Santos",
            address: "Bunguiao",
            rating: 4.0,
            language: "English, Cebuano",
            specialty: "Island Hopping",
            experience: "5 years",
            price: "₱1,200/day",
        },
        {
            id: 3,
            name: "Carlos Mendoza",
            address: "Mercedes",
            rating: 5.0,
            language: "English, Spanish, Tagalog",
            specialty: "Historical Tours",
            experience: "10 years",
            price: "₱1,800/day",
        },
        {
            id: 4,
            name: "Liza Cruz",
            address: "Zambowood",
            rating: 3.5,
            language: "English, Tagalog",
            specialty: "Rainforest & Nature Walks",
            experience: "6 years",
            price: "₱1,400/day",
        },
        {
            id: 5,
            name: "Ramon Villanueva",
            address: "Patalon",
            rating: 4.5,
            language: "English, Tagalog",
            specialty: "Wildlife & Landscape Tours",
            experience: "7 years",
            price: "₱1,600/day",
        },
    ];

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
    
    return (
        <ScrollView style={styles.container}>
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
                <Text style={styles.headerTitle}>EXPLORE YOUR NEXT DESTINATION HERE</Text>
            </View>

            <View style={styles.destinationCard}>
                {/* <Image source={destinationImage} style={styles.destinationCardImage} /> */}
                <Image source={{ uri: params.image }} style={styles.destinationCardImage} />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.destinationOverlay}
                />
                <View style={styles.destinationContent}>
                    <Text style={styles.destinationTitle}>{destinationInfo.title}</Text>
                    <Text style={styles.destinationDescription}>{destinationInfo.description}</Text>
                </View>
            </View>

            <View style={styles.contentSection}>
                <View style={styles.imageHeader}>
                    <Text style={styles.sectionTitle}>DESTINATION PREVIEW</Text>
                    <Text style={styles.sectionSubtitle}>Swipe to discover more</Text>
                </View>

                <FlatList
                    horizontal
                    data={featuredImages}
                    keyExtractor={(item) => item.id.toString()}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageList}
                    renderItem={({ item }) => (
                        <TouchableOpacity activeOpacity={0.8}>
                            <View style={styles.imageCard}>
                                <Image source={item.image} style={styles.imageCardImage} />
                                <View style={styles.imageOverlay} />
                                {/* <View style={styles.imageBottom}>
                                    <Text style={styles.imageTitle}>{item.title}</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </View> */}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <View style={styles.guideSection}>
                <Text style={styles.sectionTitle}>Available Tourist Guides</Text>
                <Text style={styles.sectionSubtitle}>Choose your perfect guide</Text>

                <View style={styles.guideList}>
                    {guideCards.map((guide) => (
                        <View key={guide.id} style={styles.guideCard}>
                            <View style={styles.cardProfileSection}>
                                <View style={styles.iconWrapper}>
                                    <User size={40} color="#8B98A8" />
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.guideName}>{guide.name}</Text>
                                    <Text style={styles.guideAddress}>{guide.address}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Text style={styles.guideRating}>{guide.rating}</Text>
                                        <Ionicons name="star" size={14} color="#C99700" />
                                    </View>
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
                                    <Text style={styles.detailLabel}>Experience</Text>
                                    <Text style={styles.detailValue}>{guide.experience}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Price</Text>
                                    <Text style={styles.detailValue}>{guide.price}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.buttonContainer}
                                activeOpacity={0.8}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(protected)/touristGuideDetails",
                                    })
                                }
                            >
                                <Text style={styles.bookButton}>BOOK NOW</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

export default FeaturedPlacesDetails;

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
    destinationCard: {
        height: 300,
        marginHorizontal: 15,
        marginVertical: 20,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    destinationCardImage: {
        width: '100%',
        height: '100%',
        objectFit: "cover",
    },
    destinationOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
    },
    destinationContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    destinationTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 1,
    },
    destinationDescription: {
        fontSize: 13,
        color: '#fff',
        lineHeight: 18,
        opacity: 0.95,
    },
    contentSection: {
        paddingVertical: 20,
    },
    imageHeader: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#1A2332',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#8B98A8',
        marginTop: 4,
    },
    imageList: {
        paddingHorizontal: 15,
    },
    imageCard: {
        width: 180,
        height: 180,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 12,
    },
    imageCardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    imageBottom: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageTitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginRight: 5,
    },
    guideSection: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    guideList: {
        marginTop: 15,
    },
    guideCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 15,
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
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    guideRating: {
        fontSize: 12,
        color: '#C99700',
        marginRight: 4,
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
        textAlign: 'center',
        width: '100%',
    },
});
