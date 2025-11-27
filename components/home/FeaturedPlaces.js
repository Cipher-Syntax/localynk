// import React, { useState, useEffect } from 'react';
// import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import { useAuth } from '../../context/AuthContext';
// import api from '../../api/api'; // Ensure this path is correct

// // Keep one static image as a fallback in case API image is missing
// import FallbackImage from '../../assets/localynk_images/featured1.png';

// const FeaturedPlaces = ({ isPublic = false }) => {
//     const router = useRouter();
//     const { isAuthenticated } = useAuth();
//     const [activeIndex, setActiveIndex] = useState(0);
    
//     // State for API data
//     const [featuredDestinations, setFeaturedDestinations] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Fetch Data
//     useEffect(() => {
//         const fetchFeatured = async () => {
//             try {
//                 const response = await api.get('/api/destinations/');
//                 // Take only the first 5 items
//                 const top5 = response.data.slice(0, 5);
//                 setFeaturedDestinations(top5);
//             } catch (error) {
//                 console.error("Failed to fetch featured places:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchFeatured();
//     }, []);

//     const handleScroll = (event) => {
//         const contentOffsetX = event.nativeEvent.contentOffset.x;
//         const currentIndex = Math.round(contentOffsetX / (180 + 12));
//         setActiveIndex(currentIndex);
//     };

//     const handleCardPress = (item) => {
//         if (isPublic && !isAuthenticated) {
//             router.push('/auth/login');
//         } else {
//             router.push({
//                 pathname: "/(protected)/placesDetails",
//                 params: {
//                     id: item.id.toString(),
//                     // Pass the image URI if it exists, otherwise generic
//                     image: item.image || item.first_image || '',
//                 },
//             });
//         }
//     };

//     const renderCard = ({ item, index }) => {
//         // Handle Image Source: Check if API provided a URL, otherwise use fallback
//         const imageSource = item.image || item.first_image || item.thumbnail
//             ? { uri: item.image || item.first_image || item.thumbnail }
//             : FallbackImage;

//         return (
//             <TouchableOpacity
//                 activeOpacity={0.7}
//                 onPress={() => handleCardPress(item)}
//             >
//                 <View style={[styles.featureCard, activeIndex === index && styles.activeCard]}>
//                     <Image source={imageSource} style={styles.featureImage} resizeMode="cover" />
                    
//                     <View style={styles.gradientOverlay} />
                    
//                     <View style={styles.cardContent}>
//                         <View style={styles.ratingBadge}>
//                             <Ionicons name="star" size={12} color="#FFD700" />
//                             <Text style={styles.ratingText}>
//                                 {item.average_rating ? item.average_rating : 'New'}
//                             </Text>
//                             {/* If your API returns review count, use it. Otherwise default to 0 or hide */}
//                             <Text style={styles.reviewsText}>
//                                 ({item.reviews_count || item.reviews || 0})
//                             </Text>
//                         </View>
//                     </View>

//                     <View style={styles.featureBottom}>
//                         <View style={styles.textContainer}>
//                             <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
//                             <Text style={styles.featureText} numberOfLines={1}>
//                                 {item.category || 'Discover More'}
//                             </Text>
//                         </View>
//                         <View style={styles.arrowIcon}>
//                             <Ionicons name="arrow-forward" size={16} color="#fff" />
//                         </View>
//                     </View>
//                 </View>
//             </TouchableOpacity>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={{ marginTop: 50, height: 250, justifyContent: 'center', alignItems: 'center' }}>
//                 <ActivityIndicator size="small" color="#00C6FF" />
//             </View>
//         );
//     }

//     // Don't render the section if no data came back
//     if (!featuredDestinations || featuredDestinations.length === 0) {
//         return null;
//     }

//     return (
//         <View style={{ marginTop: 50 }}>
//             <View style={styles.header}>
//                 <Text style={styles.title}>Featured Places</Text>
//                 <Text style={styles.subtitle}>
//                     Handpicked by locals. Loved by travelers. Discover your next stop!
//                 </Text>
//             </View>

//             <FlatList
//                 horizontal
//                 data={featuredDestinations}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.featureList}
//                 scrollEventThrottle={16}
//                 onScroll={handleScroll}
//                 snapToInterval={192} // Card width (180) + margin (12)
//                 decelerationRate="fast"
//                 renderItem={renderCard}
//             />

//             <View style={styles.indicatorContainer}>
//                 {featuredDestinations.slice(0, 5).map((_, index) => (
//                     <View
//                         key={index}
//                         style={[
//                             styles.indicator,
//                             activeIndex === index && styles.activeIndicator,
//                         ]}
//                     />
//                 ))}
//             </View>
//         </View>
//     );
// };

// export default FeaturedPlaces;

// const styles = StyleSheet.create({
//     header: { paddingHorizontal: 15, marginBottom: 15 },
//     title: { 
//         fontSize: 18, 
//         textTransform: 'uppercase', 
//         letterSpacing: 1, 
//         fontWeight: '700',
//         color: '#1a1a1a'
//     },
//     subtitle: { 
//         fontSize: 13, 
//         color: '#666', 
//         marginTop: 4,
//         lineHeight: 18
//     },
//     featureList: { paddingHorizontal: 15, paddingBottom: 10 },
//     featureCard: { 
//         width: 180, 
//         height: 200, 
//         borderRadius: 16, 
//         overflow: 'hidden', 
//         marginRight: 12,
//         backgroundColor: '#f5f5f5',
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//     },
//     activeCard: {
//         elevation: 6,
//         shadowOpacity: 0.15,
//     },
//     featureImage: { 
//         width: '100%', 
//         height: '100%', 
//         borderRadius: 16 
//     },
//     gradientOverlay: { 
//         position: 'absolute', 
//         bottom: 0, 
//         left: 0, 
//         right: 0, 
//         height: '65%', 
//         backgroundColor: 'rgba(0,0,0,0.4)'
//     },
//     cardContent: {
//         position: 'absolute',
//         top: 10,
//         right: 10,
//     },
//     ratingBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: 'rgba(255,255,255,0.95)',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 12,
//         gap: 3,
//     },
//     ratingText: {
//         fontSize: 11,
//         fontWeight: '600',
//         color: '#1a1a1a',
//     },
//     reviewsText: {
//         fontSize: 10,
//         color: '#666',
//     },
//     featureBottom: { 
//         position: 'absolute', 
//         bottom: 12, 
//         left: 12, 
//         right: 12, 
//         flexDirection: 'row', 
//         justifyContent: 'space-between', 
//         alignItems: 'center', 
//         zIndex: 2,
//     },
//     textContainer: {
//         flex: 1,
//         marginRight: 8,
//     },
//     placeName: {
//         color: '#fff',
//         fontSize: 13,
//         fontWeight: '600',
//         marginBottom: 2,
//     },
//     featureText: { 
//         color: '#fff', 
//         fontSize: 11, 
//         fontWeight: '400',
//         opacity: 0.9,
//     },
//     arrowIcon: {
//         width: 32,
//         height: 32,
//         borderRadius: 16,
//         backgroundColor: 'rgba(255,255,255,0.2)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         flexShrink: 0,
//     },
//     indicatorContainer: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingVertical: 12,
//         gap: 6,
//     },
//     indicator: {
//         width: 6,
//         height: 6,
//         borderRadius: 3,
//         backgroundColor: '#ddd',
//     },
//     activeIndicator: {
//         backgroundColor: '#333',
//         width: 20,
//     },
// });

import React, { useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

import FallbackImage from '../../assets/localynk_images/featured1.png';

// Accept 'data' prop from Parent
const FeaturedPlaces = ({ isPublic = false, data = [] }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);
    
    // Slice the data passed from parent
    const featuredDestinations = data.slice(0, 5);

    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / (180 + 12));
        setActiveIndex(currentIndex);
    };

    const handleCardPress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: "/(protected)/placesDetails",
                params: {
                    id: item.id.toString(),
                    image: item.image || item.first_image || '',
                },
            });
        }
    };

    const renderCard = ({ item, index }) => {
        const imageSource = item.image || item.first_image || item.thumbnail
            ? { uri: item.image || item.first_image || item.thumbnail }
            : FallbackImage;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCardPress(item)}
            >
                <View style={[styles.featureCard, activeIndex === index && styles.activeCard]}>
                    <Image source={imageSource} style={styles.featureImage} resizeMode="cover" />
                    
                    <View style={styles.gradientOverlay} />
                    
                    <View style={styles.cardContent}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>
                                {item.average_rating ? item.average_rating : 'New'}
                            </Text>
                            <Text style={styles.reviewsText}>
                                ({item.reviews_count || item.reviews || 0})
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureBottom}>
                        <View style={styles.textContainer}>
                            <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.featureText} numberOfLines={1}>
                                {item.category || 'Discover More'}
                            </Text>
                        </View>
                        <View style={styles.arrowIcon}>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!featuredDestinations || featuredDestinations.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 50 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Featured Places</Text>
                <Text style={styles.subtitle}>
                    Handpicked by locals. Loved by travelers. Discover your next stop!
                </Text>
            </View>

            <FlatList
                horizontal
                data={featuredDestinations}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featureList}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                snapToInterval={192}
                decelerationRate="fast"
                renderItem={renderCard}
            />

            <View style={styles.indicatorContainer}>
                {featuredDestinations.slice(0, 5).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.indicator,
                            activeIndex === index && styles.activeIndicator,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

export default FeaturedPlaces;

const styles = StyleSheet.create({
    header: { paddingHorizontal: 15, marginBottom: 15 },
    title: { 
        fontSize: 18, 
        textTransform: 'uppercase', 
        letterSpacing: 1, 
        fontWeight: '700',
        color: '#1a1a1a'
    },
    subtitle: { 
        fontSize: 13, 
        color: '#666', 
        marginTop: 4,
        lineHeight: 18
    },
    featureList: { paddingHorizontal: 15, paddingBottom: 10 },
    featureCard: { 
        width: 180, 
        height: 200, 
        borderRadius: 16, 
        overflow: 'hidden', 
        marginRight: 12,
        backgroundColor: '#f5f5f5',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    activeCard: {
        elevation: 6,
        shadowOpacity: 0.15,
    },
    featureImage: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 16 
    },
    gradientOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '65%', 
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    cardContent: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    reviewsText: {
        fontSize: 10,
        color: '#666',
    },
    featureBottom: { 
        position: 'absolute', 
        bottom: 12, 
        left: 12, 
        right: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        zIndex: 2,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    placeName: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    featureText: { 
        color: '#fff', 
        fontSize: 11, 
        fontWeight: '400',
        opacity: 0.9,
    },
    arrowIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ddd',
    },
    activeIndicator: {
        backgroundColor: '#333',
        width: 20,
    },
});