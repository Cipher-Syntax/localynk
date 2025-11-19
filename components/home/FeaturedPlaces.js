// import React, { useState } from 'react';
// import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';

// import FeaturePlace1 from '../../assets/localynk_images/featured1.png';
// import FeaturePlace2 from '../../assets/localynk_images/featured2.png';
// import FeaturePlace3 from '../../assets/localynk_images/featured3.png';

// const FeatureCards = [
//     { id: 1, image: FeaturePlace1, title: 'Mountain Vista', rating: 4.8, reviews: 234 },
//     { id: 2, image: FeaturePlace2, title: 'Beach Paradise', rating: 4.9, reviews: 512 },
//     { id: 3, image: FeaturePlace3, title: 'Urban Gems', rating: 4.7, reviews: 189 },
//     { id: 4, image: FeaturePlace1, title: 'Hidden Trails', rating: 4.6, reviews: 145 },
//     { id: 5, image: FeaturePlace2, title: 'Coastal Charm', rating: 4.9, reviews: 378 },
//     { id: 6, image: FeaturePlace3, title: 'Desert Escape', rating: 4.5, reviews: 267 },
// ];

// const FeaturedPlaces = () => {
//     const router = useRouter();
//     const [activeIndex, setActiveIndex] = useState(0);

//     const handleScroll = (event) => {
//         const contentOffsetX = event.nativeEvent.contentOffset.x;
//         const currentIndex = Math.round(contentOffsetX / (180 + 12));
//         setActiveIndex(currentIndex);
//     };

//     const renderCard = ({ item, index }) => (
//         <TouchableOpacity
//             activeOpacity={0.7}
//             onPress={() =>
//                 router.push({
//                     pathname: "/(protected)/placesDetails",
//                     params: {
//                         id: item.id.toString(),
//                         image: Image.resolveAssetSource(item.image).uri,
//                     },
//                 })
//             }
//         >
//             <View style={[styles.featureCard, activeIndex === index && styles.activeCard]}>
//                 <Image source={item.image} style={styles.featureImage} />
                
//                 <View style={styles.gradientOverlay} />
                
//                 <View style={styles.cardContent}>
//                     <View style={styles.ratingBadge}>
//                         <Ionicons name="star" size={12} color="#FFD700" />
//                         <Text style={styles.ratingText}>{item.rating}</Text>
//                         <Text style={styles.reviewsText}>({item.reviews})</Text>
//                     </View>
//                 </View>

//                 <View style={styles.featureBottom}>
//                     <View style={styles.textContainer}>
//                         <Text style={styles.placeName} numberOfLines={1}>{item.title}</Text>
//                         <Text style={styles.featureText}>Discover More</Text>
//                     </View>
//                     <View style={styles.arrowIcon}>
//                         <Ionicons name="arrow-forward" size={16} color="#fff" />
//                     </View>
//                 </View>
//             </View>
//         </TouchableOpacity>
//     );

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
//                 data={FeatureCards}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.featureList}
//                 scrollEventThrottle={16}
//                 onScroll={handleScroll}
//                 snapToInterval={192}
//                 decelerationRate="fast"
//                 renderItem={renderCard}
//             />

//             <View style={styles.indicatorContainer}>
//                 {FeatureCards.map((_, index) => (
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
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

import FeaturePlace1 from '../../assets/localynk_images/featured1.png';
import FeaturePlace2 from '../../assets/localynk_images/featured2.png';
import FeaturePlace3 from '../../assets/localynk_images/featured3.png';

const FeatureCards = [
    { id: 1, image: FeaturePlace1, title: 'Mountain Vista', rating: 4.8, reviews: 234 },
    { id: 2, image: FeaturePlace2, title: 'Beach Paradise', rating: 4.9, reviews: 512 },
    { id: 3, image: FeaturePlace3, title: 'Urban Gems', rating: 4.7, reviews: 189 },
    { id: 4, image: FeaturePlace1, title: 'Hidden Trails', rating: 4.6, reviews: 145 },
    { id: 5, image: FeaturePlace2, title: 'Coastal Charm', rating: 4.9, reviews: 378 },
    { id: 6, image: FeaturePlace3, title: 'Desert Escape', rating: 4.5, reviews: 267 },
];

const FeaturedPlaces = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);

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
                    image: Image.resolveAssetSource(item.image).uri,
                },
            });
        }
    };

    const renderCard = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleCardPress(item)}
        >
            <View style={[styles.featureCard, activeIndex === index && styles.activeCard]}>
                <Image source={item.image} style={styles.featureImage} />
                
                <View style={styles.gradientOverlay} />
                
                <View style={styles.cardContent}>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                        <Text style={styles.reviewsText}>({item.reviews})</Text>
                    </View>
                </View>

                <View style={styles.featureBottom}>
                    <View style={styles.textContainer}>
                        <Text style={styles.placeName} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.featureText}>Discover More</Text>
                    </View>
                    <View style={styles.arrowIcon}>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                data={FeatureCards}
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
                {FeatureCards.map((_, index) => (
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
