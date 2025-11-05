import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import FeaturePlace1 from '../../assets/localynk_images/featured1.png';
import FeaturePlace2 from '../../assets/localynk_images/featured2.png';
import FeaturePlace3 from '../../assets/localynk_images/featured3.png';

import DiscoverPlace1 from '../../assets/localynk_images/discover1.png';
import DiscoverPlace2 from '../../assets/localynk_images/discover2.png';
import DiscoverPlace3 from '../../assets/localynk_images/discover3.png';
import DiscoverPlace4 from '../../assets/localynk_images/discover4.png';

import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window');

const FeaturedPlaces = () => {
    const [isActive, setIsActive] = useState(2);
    const router = useRouter();

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
    }, [isActive]);

    const FeatureCards = [
        { id: 1, image: FeaturePlace1 },
        { id: 2, image: FeaturePlace2 },
        { id: 3, image: FeaturePlace3 },
        { id: 4, image: FeaturePlace1 },
        { id: 5, image: FeaturePlace2 },
        { id: 6, image: FeaturePlace3 },
    ];

    const DiscoverWhatYouWant = [
        { id: 1, image: DiscoverPlace1, name: 'BEACHES', touristGuide: "Juan" },
        { id: 2, image: DiscoverPlace2, name: 'MOUNTAINS', touristGuide: "Dela Cruz" },
        { id: 3, image: DiscoverPlace3, name: 'RIVERS', touristGuide: "John" },
        { id: 4, image: DiscoverPlace4, name: 'BEACHES', touristGuide: "Doe" },
        // { id: 5, image: DiscoverPlace4, name: 'MOUNTAINS', touristGuide: "Doe" },
        // { id: 6, image: DiscoverPlace4, name: 'RIVERS', touristGuide: "Doe" },
    ];

    return (
        <View style={{ paddingBottom: 50, }}>
            <View style={styles.container}>

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
                    renderItem={({ item }) => (
                        <TouchableOpacity activeOpacity={0.8} onPress={() => {
                            router.push({
                                pathname: "/(protected)/featuredPlacesDetails",
                                params: {
                                    id: item.id.toString(),
                                    image: Image.resolveAssetSource(item.image).uri,
                                },
                            });
                        }}
                        >
                            <View style={styles.featureCard}>
                                <Image source={item.image} style={styles.featureImage} />
                                <View style={styles.featureOverlay} />
                                <View style={styles.featureBottom}>
                                    <Text style={styles.featureText}>Discover More</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />

                <View style={styles.discoverSection}>
                    <Text style={styles.discoverTitle}>Discover What You Want</Text>
                    <View style={styles.discoverRow}>
                        {DiscoverWhatYouWant.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => {
                                    setIsActive(item.id);
                                }}
                                style={[
                                    styles.discoverItem,
                                    { 
                                        flex: isActive === item.id ? 4 : 1,
                                    },
                                ]}
                            >
                                <Image
                                    source={item.image}
                                    style={[
                                        styles.discoverImage,
                                        { opacity: isActive === item.id ? 1 : 0.8 },
                                    ]}
                                />

                                {isActive !== item.id && (
                                    <View style={styles.rotatedTextContainer}>
                                        <Text style={styles.inactiveDiscoverText} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                    </View>
                                )}

                                {isActive === item.id && (
                                    <View style={styles.activeItemContainer}>
                                        <View style={styles.titleOverlay}>
                                            <Text style={styles.activeTitle}>
                                                {item.name}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/(protected)/attractionDetails",
                                                    params: { category: item.touristGuide },
                                                })
                                            }
                                            style={styles.descriptionOverlay}
                                        >
                                            <Text style={styles.discoverSubtext}>
                                                Discover more breathtaking{'\n'}{item.name.toLowerCase()} spots
                                            </Text>
                                            <Animated.View style={{ transform: [{ translateY: bounceValue }], marginTop: 10 }}>
                                                <Ionicons name='arrow-down-outline' color="#00C6FF" size={25} />
                                            </Animated.View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Pick your paradise — from golden beaches to buzzing cities and serene mountains. Discover your kind of escape!
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default FeaturedPlaces;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
    },
    header: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#444',
        marginTop: 2,
    },
    featureList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    featureCard: {
        width: 180,
        height: 180,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 12,
    },
    featureImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    featureOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    featureBottom: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginRight: 5,
    },
    discoverSection: {
        marginTop: 20,
    },
    discoverTitle: {
        textAlign: 'center',
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: 10,
    },
    discoverRow: {
        flexDirection: 'row',
        width: '100%',
        height: 400,
        overflow: 'hidden',
        // borderRadius: 10,
    },
    discoverItem: {
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
    },
    discoverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    rotatedTextContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    inactiveDiscoverText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        transform: [{ rotate: '-90deg' }],
        letterSpacing: 2,
    },
    activeItemContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    titleOverlay: {
        paddingTop: 20,
        paddingHorizontal: 15,
        justifyContent: 'flex-start',
    },
    activeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    descriptionOverlay: {
        paddingBottom: 40,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    discoverSubtext: {
        textAlign: 'center',
        fontSize: 14,
        color: '#00C6FF',
        fontWeight: '500',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 15,
        marginTop: 15,
    },
    footerText: {
        fontSize: 10,
        textAlign: 'center',
        color: '#444',
    },
});